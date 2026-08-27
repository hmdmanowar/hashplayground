export interface SeoEntry {
  title: string
  description: string
}

// Per-route <title>/<meta description> overrides for the app's public,
// indexable pages — everything else falls back to useDocumentTitle's
// breadcrumb-derived title and DEFAULT_SEO_DESCRIPTION (those pages are
// behind auth and excluded in robots.txt, so their SEO copy doesn't matter).
export const SEO_ROUTES: Record<string, SeoEntry> = {
  '/': {
    title: 'Hash Playground — Build, Run, and Ship Web Projects Instantly',
    description:
      'Write, run, and version React + TypeScript or HTML/CSS/JS projects entirely in your browser — no installs, no setup. Free to use, with instant live preview, Git-style version history, and one-click export.',
  },
  '/docs': {
    title: 'Documentation | Hash Playground',
    description:
      "How Hash Playground works — templates, the workspace, saving and versions, style templates, and account security, all in one place.",
  },
  '/portfolio': {
    title: 'Md Manowar Hashmi — UI / Frontend Developer',
    description:
      'Portfolio of Md Manowar Hashmi, a UI/Frontend developer with 8+ years of experience in React, TypeScript, and enterprise web applications, and the creator of Hash Playground.',
  },
}

export const DEFAULT_SEO_DESCRIPTION =
  'Hash Playground — a browser-based coding platform for building, running, and sharing React and web projects instantly, no installs required.'
