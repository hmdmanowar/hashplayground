import * as Babel from '@babel/standalone'
import type { PluginItem } from '@babel/core'
import type { ProjectFile } from '../types/project'

const ENTRY_CANDIDATES = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts', 'main.tsx', 'main.ts', 'index.tsx', 'index.ts']
const HTML_ENTRY_PATH = 'index.html'

export type CompileResult =
  | { ok: true; kind: 'react'; entryPath: string; modules: Record<string, string> }
  | { ok: true; kind: 'html'; htmlFile: ProjectFile; files: ProjectFile[] }

export interface CompileError {
  ok: false
  message: string
}

function findEntryFile(files: ProjectFile[]): string | null {
  const paths = new Set(files.filter((f) => f.type === 'file').map((f) => f.path))
  return ENTRY_CANDIDATES.find((candidate) => paths.has(candidate)) ?? null
}

function compileModule(file: ProjectFile): string {
  if (file.path.endsWith('.css')) {
    return `
      var style = document.createElement('style');
      style.textContent = ${JSON.stringify(file.content)};
      document.head.appendChild(style);
      module.exports = {};
    `
  }

  if (file.path.endsWith('.json')) {
    return `module.exports = ${file.content || '{}'};`
  }

  const isTSX = file.path.endsWith('.tsx')
  const isTS = file.path.endsWith('.ts') || isTSX

  const presets: PluginItem[] = [['react', { runtime: 'automatic' }]]
  if (isTS) presets.push(['typescript', { isTSX, allExtensions: true }])

  const result = Babel.transform(file.content, {
    presets,
    plugins: ['transform-modules-commonjs'],
    filename: file.path,
  })

  return result.code ?? ''
}

// A project whose root has a plain index.html is treated as a static
// HTML/CSS/JS project (no React, no bundler) rather than the React template's
// src/main.tsx entry — the two project "kinds" seeded by CreateProject never
// overlap in practice.
export function compileProject(files: ProjectFile[]): CompileResult | CompileError {
  const htmlFile = files.find((f) => f.type === 'file' && f.path === HTML_ENTRY_PATH)
  if (htmlFile) {
    return { ok: true, kind: 'html', htmlFile, files }
  }

  const entryPath = findEntryFile(files)
  if (!entryPath) {
    return { ok: false, message: 'No entry file found (expected src/main.tsx or index.html).' }
  }

  const modules: Record<string, string> = {}
  for (const file of files) {
    if (file.type !== 'file') continue
    try {
      modules[file.path] = compileModule(file)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      return { ok: false, message: `Failed to compile ${file.path}: ${reason}` }
    }
  }

  return { ok: true, kind: 'react', entryPath, modules }
}

// Console/error forwarding to the Playground's Console strip, plus the
// localStorage/sessionStorage shim — shared by both preview kinds since
// neither has anything to do with React or the module system below.
const CONSOLE_STORAGE_ERROR_SHIM = `
  function post(type, args) {
    try {
      parent.postMessage({ __hashPlaygroundPreview: true, type: type, args: args.map(function (a) {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }) }, '*');
    } catch (e) {}
  }

  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      post(level, Array.prototype.slice.call(arguments));
      original.apply(console, arguments);
    };
  });

  // The sandboxed iframe deliberately has no 'allow-same-origin' (so previewed
  // code can never read/write Hash Playground's own localStorage/cookies),
  // but that gives it a null/opaque origin - and the real localStorage /
  // sessionStorage getters throw a SecurityError in ANY null-origin context,
  // even for storage that would only ever be the iframe's own. Since using
  // localStorage is extremely common (e.g. a todo app persisting its list),
  // shim both with a private, in-memory, per-run store: same Storage API,
  // no real persistence (resets on the next Run), but no crash either.
  function makeMemoryStorage() {
    var data = {};
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
      setItem: function (key, value) { data[key] = String(value); },
      removeItem: function (key) { delete data[key]; },
      clear: function () { data = {}; },
      key: function (index) { return Object.keys(data)[index] ?? null; },
      get length() { return Object.keys(data).length; },
    };
  }
  try {
    window.localStorage;
  } catch (e) {
    Object.defineProperty(window, 'localStorage', { value: makeMemoryStorage(), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: makeMemoryStorage(), configurable: true });
  }

  window.addEventListener('error', function (event) {
    post('crash', [event.message]);
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    post('crash', ['Unhandled promise rejection: ' + (reason && reason.message ? reason.message : reason)]);
  });
`

// The React template's module system: a minimal CommonJS-style require/define
// plus a JSX shim, so Babel's compiled-to-commonjs output can run without a
// real bundler.
const REACT_MODULE_RUNTIME = `
  window.__modules__ = {};
  window.__cache__ = {};
  window.__externalModules__ = window.__externalModules__ || {};

  function define(path, factory) {
    window.__modules__[path] = factory;
  }

  function normalizePath(path) {
    var parts = path.split('/');
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '' || part === '.') continue;
      if (part === '..') stack.pop();
      else stack.push(part);
    }
    return stack.join('/');
  }

  function resolveModulePath(fromPath, spec) {
    if (
      spec === 'react' ||
      spec === 'react-dom' ||
      spec === 'react-dom/client' ||
      spec === 'react/jsx-runtime' ||
      spec === 'react/jsx-dev-runtime'
    ) {
      return spec;
    }
    // Third-party npm packages (anything not local and not React itself) are
    // resolved ahead of time — see EXTERNAL_SPECS below — and dropped into
    // __externalModules__ before the entry module ever runs.
    if (Object.prototype.hasOwnProperty.call(window.__externalModules__, spec)) {
      return spec;
    }

    var basedir = fromPath.indexOf('/') === -1 ? '' : fromPath.slice(0, fromPath.lastIndexOf('/'));
    var target = spec.charAt(0) === '.' ? normalizePath(basedir + '/' + spec) : spec;
    var candidates = [
      target,
      target + '.tsx',
      target + '.ts',
      target + '.jsx',
      target + '.js',
      target + '.css',
      target + '.json',
      target + '/index.tsx',
      target + '/index.ts',
    ];

    for (var i = 0; i < candidates.length; i++) {
      if (Object.prototype.hasOwnProperty.call(window.__modules__, candidates[i])) return candidates[i];
    }

    throw new Error('Cannot resolve module "' + spec + '" from "' + fromPath + '"');
  }

  // Babel's "automatic" JSX runtime rewrites JSX into calls against
  // react/jsx-runtime's jsx/jsxs/Fragment exports instead of React.createElement
  // directly - this is a minimal shim so that works without a real bundler.
  // React.createElement already falls back to whatever props.children was
  // set to when no extra children arguments are passed, so this is a
  // correct (not just approximate) implementation, not a partial polyfill.
  function jsxShim(type, props, key) {
    var config = props || {};
    if (key !== undefined) {
      config = Object.assign({}, config, { key: key });
    }
    return window.React.createElement(type, config);
  }
  var jsxRuntimeModule = { jsx: jsxShim, jsxs: jsxShim, Fragment: window.React && window.React.Fragment };

  window.__requireModule__ = function requireModule(fromPath, spec) {
    if (spec === 'react') return window.React;
    if (spec === 'react-dom' || spec === 'react-dom/client') return window.ReactDOM;
    if (spec === 'react/jsx-runtime' || spec === 'react/jsx-dev-runtime') return jsxRuntimeModule;
    if (Object.prototype.hasOwnProperty.call(window.__externalModules__, spec)) {
      return window.__externalModules__[spec];
    }

    var resolved = resolveModulePath(fromPath, spec);
    if (window.__cache__[resolved]) return window.__cache__[resolved].exports;

    var factory = window.__modules__[resolved];
    if (!factory) throw new Error('Module not found: ' + resolved);

    var mod = { exports: {} };
    window.__cache__[resolved] = mod;
    try {
      factory(mod, mod.exports, function (childSpec) {
        return requireModule(resolved, childSpec);
      });
    } catch (error) {
      delete window.__cache__[resolved];
      throw error;
    }
    return mod.exports;
  };

  window.__define__ = define;
`

const RUNTIME_SCRIPT = `(function () {${CONSOLE_STORAGE_ERROR_SHIM}${REACT_MODULE_RUNTIME}})();`
const HTML_RUNTIME_SCRIPT = `(function () {${CONSOLE_STORAGE_ERROR_SHIM}})();`

const REQUIRE_CALL_PATTERN = /require\(\s*["']([^"']+)["']\s*\)/g
const RESERVED_REACT_SPECS = new Set([
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
])

// Any bare (non-relative) import specifier that isn't React itself is a
// third-party npm package — there's no real npm/bundler here, so those are
// resolved at runtime from esm.sh instead (see buildExternalModulesBootstrap).
function findExternalSpecs(modules: Record<string, string>): string[] {
  const specs = new Set<string>()
  for (const code of Object.values(modules)) {
    for (const match of code.matchAll(REQUIRE_CALL_PATTERN)) {
      const spec = match[1]
      if (spec.startsWith('.') || RESERVED_REACT_SPECS.has(spec)) continue
      specs.add(spec)
    }
  }
  return [...specs]
}

// Fetches third-party packages from esm.sh at runtime and registers them in
// __externalModules__ before the entry module runs. React/ReactDOM are
// de-duped against the same window.React/window.ReactDOM instance the rest
// of the project already uses (via blob-URL shim modules registered in an
// import map) — packages like react-router-dom rely on sharing the exact
// same React module as the host tree, or their hooks/context break.
function buildExternalModulesBootstrap(externalSpecs: string[]): string {
  return `
  (function () {
    function forwardingModuleSource(globalName) {
      var obj = window[globalName];
      var lines = ['const R = window.' + globalName + ';', 'export default R;'];
      Object.keys(obj).forEach(function (key) {
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) return;
        lines.push('export const ' + key + ' = R[' + JSON.stringify(key) + '];');
      });
      return lines.join('\\n');
    }
    function jsxRuntimeModuleSource() {
      return [
        'const R = window.React;',
        'function jsxShim(type, props, key) {',
        '  var config = props || {};',
        '  if (key !== undefined) config = Object.assign({}, config, { key: key });',
        '  return R.createElement(type, config);',
        '}',
        'export const jsx = jsxShim;',
        'export const jsxs = jsxShim;',
        'export const Fragment = R.Fragment;',
      ].join('\\n');
    }
    function blobUrl(source) {
      return URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    }

    var importMap = {
      imports: {
        react: blobUrl(forwardingModuleSource('React')),
        'react-dom': blobUrl(forwardingModuleSource('ReactDOM')),
        'react-dom/client': blobUrl(forwardingModuleSource('ReactDOM')),
        'react/jsx-runtime': blobUrl(jsxRuntimeModuleSource()),
        'react/jsx-dev-runtime': blobUrl(jsxRuntimeModuleSource()),
      },
    };
    var importMapScript = document.createElement('script');
    importMapScript.type = 'importmap';
    importMapScript.textContent = JSON.stringify(importMap);
    document.head.appendChild(importMapScript);

    var specs = ${JSON.stringify(externalSpecs)};
    Promise.all(
      specs.map(function (spec) {
        return import('https://esm.sh/' + spec + '?external=react,react-dom').then(function (mod) {
          window.__externalModules__[spec] = mod;
        });
      }),
    )
      .then(function () {
        window.__runEntry__();
      })
      .catch(function (error) {
        window.__reportCrash__('Failed to load "' + specs.join(', ') + '" — ' + (error && error.message ? error.message : error));
      });
  })();
  `
}

function buildReactPreviewDocument(entryPath: string, modules: Record<string, string>): string {
  const moduleScripts = Object.entries(modules)
    .map(
      ([path, code]) => `
    <script>
      window.__define__(${JSON.stringify(path)}, function (module, exports, require) {
        ${code}
      });
    </script>`,
    )
    .join('\n')

  const externalSpecs = findExternalSpecs(modules)

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>html, body, #root { height: 100%; margin: 0; } body { font-family: system-ui, sans-serif; color: #111; }</style>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script>${RUNTIME_SCRIPT}</script>
${moduleScripts}
<script>
  window.__runEntry__ = function () {
    try {
      window.__requireModule__('', ${JSON.stringify(entryPath)});
    } catch (error) {
      window.__reportCrash__(String(error && error.stack || error));
    }
  };
  window.__reportCrash__ = function (message) {
    if (parent) {
      parent.postMessage({ __hashPlaygroundPreview: true, type: 'crash', args: [message] }, '*');
    }
  };
  ${externalSpecs.length === 0 ? 'window.__runEntry__();' : ''}
</script>
${externalSpecs.length > 0 ? `<script>${buildExternalModulesBootstrap(externalSpecs)}</script>` : ''}
</body>
</html>`
}

// Inlines the project's own <link rel="stylesheet"> and <script src> files
// (resolved against the project's actual files, not blindly every .css/.js
// file) since the sandboxed iframe has no real file server to fetch them
// from — external (http/https) references are left untouched.
function buildHtmlPreviewDocument(files: ProjectFile[], htmlFile: ProjectFile): string {
  const byPath = new Map(files.filter((f) => f.type === 'file').map((f) => [f.path, f]))
  const htmlDir = htmlFile.path.includes('/') ? htmlFile.path.slice(0, htmlFile.path.lastIndexOf('/') + 1) : ''

  function resolve(ref: string): ProjectFile | undefined {
    if (/^([a-z]+:)?\/\//i.test(ref)) return undefined
    return byPath.get(ref) ?? byPath.get(`${htmlDir}${ref}`)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlFile.content, 'text/html')

  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href')
    const file = href ? resolve(href) : undefined
    if (!file) return
    const style = doc.createElement('style')
    style.textContent = file.content
    link.replaceWith(style)
  })

  doc.querySelectorAll('script[src]').forEach((script) => {
    const src = script.getAttribute('src')
    const file = src ? resolve(src) : undefined
    if (!file) return
    const inline = doc.createElement('script')
    for (const attr of Array.from(script.attributes)) {
      if (attr.name === 'src') continue
      inline.setAttribute(attr.name, attr.value)
    }
    inline.textContent = file.content
    script.replaceWith(inline)
  })

  const shim = doc.createElement('script')
  shim.textContent = HTML_RUNTIME_SCRIPT
  doc.head.prepend(shim)

  return `<!doctype html>\n${doc.documentElement.outerHTML}`
}

export function buildPreviewDocument(result: CompileResult): string {
  if (result.kind === 'html') return buildHtmlPreviewDocument(result.files, result.htmlFile)
  return buildReactPreviewDocument(result.entryPath, result.modules)
}
