import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import { emmetJSX, emmetHTML, emmetCSS } from 'emmet-monaco-es'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    return new editorWorker()
  },
}

// Without this, the TS/JS language service has no idea JSX exists — every
// ".tsx" file floods with cascading false-positive syntax errors starting at
// the first "<" tag (each open model's own file extension, set via the
// Editor's `path` prop, is what actually switches its parser into TSX mode;
// this just makes the compiler accept and correctly emit that syntax).
// `ReactJSX` (the automatic runtime) is deliberate, not `React` (classic) —
// classic mode requires a literal `import React from 'react'` in every file
// that uses JSX purely for the type-checker's sake, which none of this
// project's own files do (matches the seeded files and runPreview.ts's Babel
// config, which also uses the automatic runtime).
const compilerOptions = {
  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  target: monaco.languages.typescript.ScriptTarget.ES2020,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  esModuleInterop: true,
  allowNonTsExtensions: true,
  allowJs: true,
}
monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)

// This playground opens each file as its own isolated model rather than a
// linked multi-file TS project, so relative imports between project files
// (e.g. `import App from './App'`) have nothing to resolve against and would
// otherwise show as a permanent, incorrect "Cannot find module" error.
const diagnosticsOptions = { diagnosticCodesToIgnore: [2307, 2306, 2792] }
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions)
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions)

// Monaco's built-in 'vs-dark'/'vs' themes only approximate VS Code's actual
// Dark+/Light+ palettes - close enough for plain code, but JSX-specific scopes
// (tag names, attribute names) land on noticeably different hues. These two
// themes port the real Dark+/Light+ token colors for the scopes that matter
// here, on top of the base theme's UI chrome (background, cursor, etc.), and
// double as the source Monaco's semantic-highlighting scope-mapping reads
// from (enabled via `semanticHighlighting.enabled` on the editor instance).
monaco.editor.defineTheme('hash-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.regexp', foreground: 'D16969' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'constant.numeric', foreground: 'B5CEA8' },
    { token: 'constant.language', foreground: '569CD6' },
    { token: 'keyword', foreground: 'C586C0' },
    { token: 'keyword.control', foreground: 'C586C0' },
    { token: 'storage.type', foreground: '569CD6' },
    { token: 'storage.modifier', foreground: '569CD6' },
    { token: 'entity.name.function', foreground: 'DCDCAA' },
    { token: 'entity.name.type', foreground: '4EC9B0' },
    { token: 'entity.name.type.class', foreground: '4EC9B0' },
    { token: 'entity.name.type.interface', foreground: '4EC9B0' },
    { token: 'entity.name.tag', foreground: '569CD6' },
    { token: 'entity.other.attribute-name', foreground: '9CDCFE' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'variable.parameter', foreground: '9CDCFE' },
    { token: 'variable.other.property', foreground: '9CDCFE' },
    { token: 'delimiter', foreground: 'D4D4D4' },
  ],
  colors: {},
})

monaco.editor.defineTheme('hash-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008000' },
    { token: 'string', foreground: 'A31515' },
    { token: 'string.regexp', foreground: '811F3F' },
    { token: 'number', foreground: '098658' },
    { token: 'constant.numeric', foreground: '098658' },
    { token: 'constant.language', foreground: '0000FF' },
    { token: 'keyword', foreground: 'AF00DB' },
    { token: 'keyword.control', foreground: 'AF00DB' },
    { token: 'storage.type', foreground: '0000FF' },
    { token: 'storage.modifier', foreground: '0000FF' },
    { token: 'entity.name.function', foreground: '795E26' },
    { token: 'entity.name.type', foreground: '267F99' },
    { token: 'entity.name.type.class', foreground: '267F99' },
    { token: 'entity.name.type.interface', foreground: '267F99' },
    { token: 'entity.name.tag', foreground: '800000' },
    { token: 'entity.other.attribute-name', foreground: 'E50000' },
    { token: 'variable', foreground: '001080' },
    { token: 'variable.parameter', foreground: '001080' },
    { token: 'variable.other.property', foreground: '001080' },
    { token: 'delimiter', foreground: '000000' },
  ],
  colors: {},
})

// Emmet abbreviation expansion (e.g. "div" + Tab -> <div></div>), matching
// VS Code's built-in behavior — not something monaco-editor ships on its own.
emmetJSX(monaco, ['javascript', 'typescript'])
emmetHTML(monaco, ['html'])
emmetCSS(monaco, ['css'])

loader.config({ monaco })
