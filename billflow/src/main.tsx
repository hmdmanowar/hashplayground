import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// createRoot (not hydrateRoot): the prerendered markup inside #root is
// crawler-facing static content that React simply replaces on mount.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
