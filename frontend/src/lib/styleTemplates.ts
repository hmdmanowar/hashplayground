import type { ProjectFile } from '../types/project'

// A style framework that's actually injected into the project's files.
export type AppliedStyle = 'bootstrap' | 'tailwind'
// What's selectable in the dialog — 'none' removes whichever framework (if
// any) is currently applied, without injecting a replacement.
export type StyleTemplate = 'none' | AppliedStyle

export const BOOTSTRAP_CSS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
export const TAILWIND_CDN_URL = 'https://cdn.tailwindcss.com'

export interface StylePlan {
  updates: { fileId: string; content: string }[]
  creates: { name: string; path: string; content: string }[]
  deletes: string[]
}

export type StylePlanResult =
  | { ok: true; alreadyApplied: true }
  | ({ ok: true; alreadyApplied: false } & StylePlan)
  | { ok: false; message: string }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isStyleTemplateApplied(files: ProjectFile[], isHtmlTemplate: boolean, style: AppliedStyle): boolean {
  if (isHtmlTemplate) {
    const htmlFile = files.find((file) => file.path === 'index.html')
    if (!htmlFile) return false
    const marker = style === 'bootstrap' ? 'bootstrap' : 'cdn.tailwindcss.com'
    return htmlFile.content.toLowerCase().includes(marker)
  }

  const mainFile = files.find((file) => file.path === 'src/main.tsx')
  if (!mainFile) return false
  if (style === 'bootstrap') {
    return mainFile.content.includes('styles.css') || files.some((file) => file.path === 'src/styles.css')
  }
  return mainFile.content.includes('cdn.tailwindcss.com')
}

// Which style (if any) is currently applied — drives the "selected" state
// in StyleTemplateDialog's cards, and lets planStyleTemplate clean up the
// old framework when switching to a different one (including switching to
// "none").
export function detectAppliedStyleTemplate(files: ProjectFile[], isHtmlTemplate: boolean): AppliedStyle | null {
  if (isStyleTemplateApplied(files, isHtmlTemplate, 'bootstrap')) return 'bootstrap'
  if (isStyleTemplateApplied(files, isHtmlTemplate, 'tailwind')) return 'tailwind'
  return null
}

const REACT_TAILWIND_BLOCK = `const tailwindScript = document.createElement('script')\ntailwindScript.src = '${TAILWIND_CDN_URL}'\ndocument.head.appendChild(tailwindScript)`

// Strips whatever planStyleTemplate previously injected for `style` from a
// main.tsx/index.html content string — a no-op if that style was never
// applied. Only removes exactly what this module writes, so a manual edit
// elsewhere in the file is left untouched.
function stripReactInjection(content: string, style: AppliedStyle): string {
  if (style === 'bootstrap') {
    return content.replace(/\n?import '\.\/styles\.css'\n?/g, '\n')
  }
  return content.replace(new RegExp(`\\n?${escapeRegExp(REACT_TAILWIND_BLOCK)}\\n?`, 'g'), '\n')
}

function stripHtmlInjection(content: string, style: AppliedStyle): string {
  const tag =
    style === 'bootstrap'
      ? `<link href="${BOOTSTRAP_CSS_URL}" rel="stylesheet" />`
      : `<script src="${TAILWIND_CDN_URL}"></script>`
  return content.replace(new RegExp(`[ \\t]*${escapeRegExp(tag)}\\n?`, 'g'), '')
}

// Retroactive version of backend/src/modules/projects/seedFiles.ts's
// applyReactStyleTemplate/applyHtmlStyleTemplate — same idea (inject via
// string content, not a schema change), kept in sync manually like this
// app's other frontend/backend seed duplication. Unlike the seed-time
// version, this also handles *switching* frameworks (including to "none"):
// it strips whatever was previously applied before injecting the newly
// selected one, so a project never ends up with both loaded at once.
export function planStyleTemplate(
  files: ProjectFile[],
  isHtmlTemplate: boolean,
  style: StyleTemplate,
): StylePlanResult {
  const currentlyApplied = detectAppliedStyleTemplate(files, isHtmlTemplate)
  if (currentlyApplied === style || (style === 'none' && !currentlyApplied)) {
    return { ok: true, alreadyApplied: true }
  }

  if (isHtmlTemplate) {
    const htmlFile = files.find((file) => file.path === 'index.html')
    if (!htmlFile) return { ok: false, message: 'Could not find index.html in this project' }

    let content = htmlFile.content
    if (currentlyApplied) content = stripHtmlInjection(content, currentlyApplied)

    if (style !== 'none') {
      const tag =
        style === 'bootstrap'
          ? `<link href="${BOOTSTRAP_CSS_URL}" rel="stylesheet" />`
          : `<script src="${TAILWIND_CDN_URL}"></script>`

      const headCloseIndex = content.indexOf('</head>')
      if (headCloseIndex === -1) return { ok: false, message: 'Could not find a </head> tag to add this to' }

      // Insert as its own line right before </head>'s line (not at the
      // exact "</head>" offset), so the new tag gets clean sibling
      // indentation instead of splitting </head> away from its own
      // leading whitespace.
      const headLineStart = content.lastIndexOf('\n', headCloseIndex) + 1
      content = `${content.slice(0, headLineStart)}    ${tag}\n${content.slice(headLineStart)}`
    }

    return { ok: true, alreadyApplied: false, updates: [{ fileId: htmlFile.id, content }], creates: [], deletes: [] }
  }

  const mainFile = files.find((file) => file.path === 'src/main.tsx')
  if (!mainFile) return { ok: false, message: 'Could not find src/main.tsx in this project' }

  let mainContent = mainFile.content
  const deletes: string[] = []
  if (currentlyApplied) {
    mainContent = stripReactInjection(mainContent, currentlyApplied).replace(/\n+$/, '\n')
    if (currentlyApplied === 'bootstrap') {
      const stylesFile = files.find((file) => file.path === 'src/styles.css')
      if (stylesFile) deletes.push(stylesFile.id)
    }
  }

  if (style === 'none') {
    return { ok: true, alreadyApplied: false, updates: [{ fileId: mainFile.id, content: mainContent }], creates: [], deletes }
  }

  if (style === 'bootstrap') {
    return {
      ok: true,
      alreadyApplied: false,
      updates: [{ fileId: mainFile.id, content: `${mainContent}\nimport './styles.css'\n` }],
      creates: [{ name: 'styles.css', path: 'src/styles.css', content: `@import url("${BOOTSTRAP_CSS_URL}");\n` }],
      deletes,
    }
  }

  const updatedMain = `${mainContent}\n${REACT_TAILWIND_BLOCK}\n`
  return {
    ok: true,
    alreadyApplied: false,
    updates: [{ fileId: mainFile.id, content: updatedMain }],
    creates: [],
    deletes,
  }
}
