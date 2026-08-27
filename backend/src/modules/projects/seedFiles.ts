// Ported verbatim from frontend/src/services/fileService.ts's DEFAULT_FILES_REACT/DEFAULT_FILES_HTML —
// keep these two in sync if the frontend's defaults ever change.
export const REACT_TEMPLATE = 'Blank React + TypeScript'
export const HTML_TEMPLATE = 'HTML + CSS + JavaScript'

// The actual Hash Playground logo (same image as the navbar's Logo
// component), embedded as a data URI so the default project's welcome
// screen renders offline with no dependency on the app's own hashed asset
// URLs or any external host.
const LOGO_DATA_URL =
  'data:image/png;base64,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'

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
    content: `import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CAPABILITIES = [
  'Write real React + TypeScript or HTML/CSS/JS projects',
  'See changes render instantly in the live preview',
  'Every project auto-saves to your account as you type',
  'Manage files like a real IDE — create, rename, organize',
  'Export any project as a ready-to-run npm scaffold',
]

function HashLogo() {
  return (
    <img
      src="${LOGO_DATA_URL}"
      alt="Hash Playground"
      style={{ display: 'block', margin: '0 auto', width: 40, height: 40, borderRadius: 10 }}
    />
  )
}

function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 16

    const setSize = () => {
      const { clientWidth, clientHeight } = container
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    setSize()

    const count = 260
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color: 0x7091e6, size: 0.12, transparent: true, opacity: 0.75 })
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    let frameId: number
    const animate = () => {
      particles.rotation.y += 0.0012
      particles.rotation.x += 0.0004
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('resize', setSize)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', setSize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}

function App() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#0b0d12',
        color: '#f5f5f7',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <ParticleField />
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <HashLogo />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#7091e6',
            marginTop: '0.75rem',
          }}
        >
          Hash Playground
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.75rem' }}>Build. Experiment. Learn. Ship.</h1>
        <p style={{ marginTop: '1rem', color: '#a3a7b3', lineHeight: 1.6 }}>
          Our mission is simple: make learning to code feel like actually building something real — no installs, no
          setup, just a browser and an idea.
        </p>
        <ul style={{ marginTop: '2rem', textAlign: 'left', display: 'inline-block', color: '#d5d7de', lineHeight: 1.8 }}>
          {CAPABILITIES.map((item) => (
            <li key={item} style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#7091e6', marginRight: '0.5rem' }}>›</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#71757f' }}>
          This is your blank canvas — edit{' '}
          <code
            style={{
              background: 'rgba(112, 145, 230, 0.15)',
              color: '#7091e6',
              padding: '0.1rem 0.35rem',
              borderRadius: '0.3rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            src/App.tsx
          </code>{' '}
          to make it yours.
        </p>
      </div>
    </div>
  )
}

export default App
`,
  },
]

const DEFAULT_FILES_HTML: SeedFile[] = [
  {
    name: 'index.html',
    path: 'index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Project</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div id="scene"></div>
    <main>
      <img src="${LOGO_DATA_URL}" alt="Hash Playground" class="logo" />
      <p class="eyebrow">Hash Playground</p>
      <h1>Build. Experiment. Learn. Ship.</h1>
      <p class="lead">
        Our mission is simple: make learning to code feel like actually building something real — no installs, no
        setup, just a browser and an idea.
      </p>
      <ul>
        <li>Write real React + TypeScript or HTML/CSS/JS projects</li>
        <li>See changes render instantly in the live preview</li>
        <li>Every project auto-saves to your account as you type</li>
        <li>Manage files like a real IDE — create, rename, organize</li>
        <li>Export any project as a ready-to-run npm scaffold</li>
      </ul>
      <p class="hint">
        This is your blank canvas — edit <code>index.html</code>, <code>style.css</code>, or
        <code>script.js</code> to make it yours.
      </p>
    </main>
    <script type="module" src="script.js"></script>
  </body>
</html>
`,
  },
  {
    name: 'style.css',
    path: 'style.css',
    content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  background: #0b0d12;
  color: #f5f5f7;
  overflow-x: hidden;
}

#scene {
  position: fixed;
  inset: 0;
  z-index: -1;
}

main {
  position: relative;
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  text-align: center;
}

.logo {
  display: block;
  margin: 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #7091e6;
  margin-top: 0.75rem;
}

h1 {
  font-size: 2rem;
  margin-top: 0.75rem;
}

.lead {
  margin-top: 1rem;
  color: #a3a7b3;
  line-height: 1.6;
}

ul {
  margin-top: 2rem;
  text-align: left;
  display: inline-block;
  color: #d5d7de;
  line-height: 1.8;
  padding-left: 1.2rem;
}

.hint {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #71757f;
}

.hint code {
  background: rgba(112, 145, 230, 0.15);
  color: #7091e6;
  padding: 0.1rem 0.35rem;
  border-radius: 0.3rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
`,
  },
  {
    name: 'script.js',
    path: 'script.js',
    content: `import * as THREE from 'https://unpkg.com/three@0.169.0/build/three.module.js'

const container = document.getElementById('scene')

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
camera.position.z = 16

function setSize() {
  const { clientWidth, clientHeight } = container
  if (clientWidth === 0 || clientHeight === 0) return
  renderer.setSize(clientWidth, clientHeight)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}
setSize()

const count = 260
const positions = new Float32Array(count * 3)
for (let i = 0; i < count; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 36
  positions[i * 3 + 1] = (Math.random() - 0.5) * 20
  positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4
}
const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
const material = new THREE.PointsMaterial({ color: 0x7091e6, size: 0.12, transparent: true, opacity: 0.75 })
const particles = new THREE.Points(geometry, material)
scene.add(particles)

function animate() {
  particles.rotation.y += 0.0012
  particles.rotation.x += 0.0004
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()

window.addEventListener('resize', setSize)
`,
  },
]

export type StyleTemplate = 'none' | 'bootstrap' | 'tailwind'

const BOOTSTRAP_CSS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
const TAILWIND_CDN_URL = 'https://cdn.tailwindcss.com'

// Applied by mutating a clone of the seed files' own content strings via
// string replacement, rather than restructuring the seed arrays themselves —
// keeps this independent of exactly how each template's welcome screen is
// written.
function applyReactStyleTemplate(files: SeedFile[], styleTemplate: StyleTemplate): SeedFile[] {
  if (styleTemplate === 'none') return files
  const mainFile = files.find((file) => file.path === 'src/main.tsx')
  if (!mainFile) return files

  if (styleTemplate === 'bootstrap') {
    mainFile.content = mainFile.content.replace(
      "import { createRoot } from 'react-dom/client'",
      "import { createRoot } from 'react-dom/client'\nimport './styles.css'",
    )
    files.push({
      name: 'styles.css',
      path: 'src/styles.css',
      content: `@import url("${BOOTSTRAP_CSS_URL}");\n`,
    })
  } else {
    mainFile.content = mainFile.content.replace(
      "createRoot(document.getElementById('root')!).render(<App />)",
      `const tailwindScript = document.createElement('script')\ntailwindScript.src = '${TAILWIND_CDN_URL}'\ndocument.head.appendChild(tailwindScript)\n\ncreateRoot(document.getElementById('root')!).render(<App />)`,
    )
  }

  return files
}

function applyHtmlStyleTemplate(files: SeedFile[], styleTemplate: StyleTemplate): SeedFile[] {
  if (styleTemplate === 'none') return files
  const htmlFile = files.find((file) => file.path === 'index.html')
  if (!htmlFile) return files

  const tag =
    styleTemplate === 'bootstrap'
      ? `<link href="${BOOTSTRAP_CSS_URL}" rel="stylesheet" />`
      : `<script src="${TAILWIND_CDN_URL}"></script>`

  htmlFile.content = htmlFile.content.replace(
    '<link rel="stylesheet" href="style.css" />',
    `${tag}\n    <link rel="stylesheet" href="style.css" />`,
  )

  return files
}

export function seedFilesForTemplate(template: string, styleTemplate: StyleTemplate = 'none'): SeedFile[] {
  const base = template === HTML_TEMPLATE ? DEFAULT_FILES_HTML : DEFAULT_FILES_REACT
  const files = base.map((file) => ({ ...file }))
  return template === HTML_TEMPLATE
    ? applyHtmlStyleTemplate(files, styleTemplate)
    : applyReactStyleTemplate(files, styleTemplate)
}
