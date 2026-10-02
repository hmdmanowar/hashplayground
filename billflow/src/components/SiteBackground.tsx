import { lazy, Suspense } from 'react'

// Same backdrop as the Hash Playground home page: a masked grid with a
// drifting glow, plus the shared three.js particle field. HeroCanvas is
// imported from the main app (not copied) so both stay identical, and it's
// lazy-loaded so three.js never delays the generator's first paint.
const HeroCanvas = lazy(() => import('../../../frontend/src/components/HeroCanvas/HeroCanvas'))

function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden" aria-hidden="true">
      <div
        className="absolute inset-0 overflow-hidden opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
        }}
      >
        <div className="grid-glow" />
      </div>
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>
    </div>
  )
}

export default SiteBackground
