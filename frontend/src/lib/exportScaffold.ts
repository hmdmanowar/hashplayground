import { HTML_TEMPLATE } from '../constants/projectTemplates'

const REACT_VERSION = '^18.3.1'
const VITE_VERSION = '^5.4.10'
const REACT_PLUGIN_VERSION = '^4.3.3'
const TYPESCRIPT_VERSION = '~5.6.2'
const TYPES_REACT_VERSION = '^18.3.12'
const TYPES_REACT_DOM_VERSION = '^18.3.1'

export function getScaffoldFiles(projectName: string, packageName: string, template?: string): Record<string, string> {
  // The HTML/CSS/JS template's own index.html is already a complete, runnable
  // static site — no bundler/package.json scaffold to add, just a README.
  if (template === HTML_TEMPLATE) {
    return {
      'README.md': `# ${projectName}

Exported from Hash Playground.

## Run it locally

Open \`index.html\` directly in your browser, or serve this folder with any static file server.
`,
    }
  }

  const packageJson = {
    name: packageName,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: REACT_VERSION,
      'react-dom': REACT_VERSION,
    },
    devDependencies: {
      '@types/react': TYPES_REACT_VERSION,
      '@types/react-dom': TYPES_REACT_DOM_VERSION,
      '@vitejs/plugin-react': REACT_PLUGIN_VERSION,
      typescript: TYPESCRIPT_VERSION,
      vite: VITE_VERSION,
    },
  }

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

  const tsconfigJson = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
    },
    include: ['src', 'vite.config.ts'],
  }

  const readme = `# ${projectName}

Exported from Hash Playground.

## Run it locally

\`\`\`sh
npm install
npm run dev
\`\`\`
`

  return {
    'package.json': JSON.stringify(packageJson, null, 2) + '\n',
    'vite.config.ts': viteConfig,
    'index.html': indexHtml,
    'tsconfig.json': JSON.stringify(tsconfigJson, null, 2) + '\n',
    'README.md': readme,
  }
}
