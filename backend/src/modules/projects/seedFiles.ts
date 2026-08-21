// Ported verbatim from frontend/src/services/fileService.ts's DEFAULT_FILES_REACT/DEFAULT_FILES_HTML —
// keep these two in sync if the frontend's defaults ever change.
export const REACT_TEMPLATE = 'Blank React + TypeScript'
export const HTML_TEMPLATE = 'HTML + CSS + JavaScript'

interface SeedFile {
  name: string
  path: string
  content: string
}

const DEFAULT_FILES_REACT: SeedFile[] = [
  {
    name: 'main.tsx',
    path: 'src/main.tsx',
    content:
      "import { createRoot } from 'react-dom/client'\nimport App from './App'\n\ncreateRoot(document.getElementById('root')!).render(<App />)\n",
  },
  {
    name: 'App.tsx',
    path: 'src/App.tsx',
    content:
      "import { useState } from 'react'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  )\n}\n\nexport default App\n",
  },
]

const DEFAULT_FILES_HTML: SeedFile[] = [
  {
    name: 'index.html',
    path: 'index.html',
    content:
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>My Project</title>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <h1>Hello, world!</h1>\n    <button id="counter">Clicked 0 times</button>\n    <script src="script.js"></script>\n  </body>\n</html>\n',
  },
  {
    name: 'style.css',
    path: 'style.css',
    content:
      'body {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  margin: 0;\n  gap: 1rem;\n}\n',
  },
  {
    name: 'script.js',
    path: 'script.js',
    content:
      "let count = 0\nconst button = document.getElementById('counter')\n\nbutton.addEventListener('click', () => {\n  count++\n  button.textContent = `Clicked ${count} times`\n})\n",
  },
]

export function seedFilesForTemplate(template: string): SeedFile[] {
  return template === HTML_TEMPLATE ? DEFAULT_FILES_HTML : DEFAULT_FILES_REACT
}
