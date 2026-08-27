import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { PageHeaderProvider, usePageFullscreenValue } from '../../context/PageHeaderContext'

function isPlaygroundPath(path: string): boolean {
  return /^\/projects\/(?!new$)[^/]+$/.test(path)
}

function LayoutContent() {
  const { pathname } = useLocation()
  const isFullBleed = pathname === '/' || pathname === '/docs'
  const fullscreen = usePageFullscreenValue()

  // The global nav sidebar auto-collapses once, on the moment of entering the
  // Playground (more room for the editor) — it doesn't stay force-collapsed,
  // so manually re-expanding it while still inside Playground sticks.
  const [collapsed, setCollapsed] = useState(() => isPlaygroundPath(pathname))
  const wasPlaygroundRef = useRef(isPlaygroundPath(pathname))

  useEffect(() => {
    const isPlayground = isPlaygroundPath(pathname)
    if (isPlayground && !wasPlaygroundRef.current) {
      setCollapsed(true)
    }
    wasPlaygroundRef.current = isPlayground
  }, [pathname])

  // "Maximize" (Playground's editor-panel toggle) hides the surrounding app
  // chrome — Navbar, global Sidebar, breadcrumb header — so the Playground's
  // own panels (Explorer/Editor/Preview/Log) expand to fill the viewport,
  // unchanged relative to each other. Outlet stays at the exact same position
  // in the tree either way (only its siblings/ancestors' children toggle) —
  // restructuring Outlet's own ancestor chain would make React remount
  // Playground on every toggle, wiping its state right back to non-fullscreen.
  return (
    <div className={`flex h-screen flex-col overflow-hidden ${fullscreen ? 'p-3' : ''}`}>
      {!fullscreen && (
        <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((prev) => !prev)} />
      )}
      <div className="flex flex-1 overflow-hidden">
        {!fullscreen && <Sidebar collapsed={collapsed} />}
        <main
          className={`mx-auto flex min-w-0 flex-1 flex-col ${
            fullscreen ? '' : isFullBleed ? '' : 'px-3 py-3'
          }`}
        >
          {!fullscreen && <Header />}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Layout() {
  return (
    <PageHeaderProvider>
      <LayoutContent />
    </PageHeaderProvider>
  )
}

export default Layout
