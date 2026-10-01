import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import SiteBackground from './components/SiteBackground'
import GeneratorPage from './pages/GeneratorPage'
import TemplatesPage from './pages/TemplatesPage'
import { findTemplate } from './lib/templates'

function TemplateRoute() {
  const { slug = '' } = useParams()
  const template = findTemplate(slug)
  if (!template) return <Navigate to="/" replace />
  // Keyed by slug so switching templates remounts with that template's draft.
  return <GeneratorPage key={template.slug} template={template} />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  // Block body, not `() => window.scrollTo(...)`: newer browsers return a
  // Promise from scrollTo, which React would then call as the effect cleanup.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <BrowserRouter basename="/billflow">
      <ScrollToTop />
      <SiteBackground />
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<TemplateRoute />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/:slug" element={<TemplateRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}

export default App
