import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// BillFlow is a separate app whose prerendered files live under /billflow/
// on the same static site. This route only runs when the host fell through
// to this SPA — an unknown /billflow/<slug>, or /billflow without the
// trailing slash — so a hard navigation to the BillFlow home fixes it.
// /billflow/ itself is never redirected, to avoid a loop if BillFlow's
// files are ever missing from a deploy.
function BillflowRedirect() {
  const { pathname } = useLocation()
  const isBillflowHome = pathname === '/billflow/'

  useEffect(() => {
    if (!isBillflowHome) window.location.replace('/billflow/')
  }, [isBillflowHome])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-sm text-[var(--color-muted)]">
      {isBillflowHome ? 'BillFlow is temporarily unavailable. Please try again shortly.' : 'Opening BillFlow…'}
    </div>
  )
}

export default BillflowRedirect
