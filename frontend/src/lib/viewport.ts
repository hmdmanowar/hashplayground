// Matches Navbar's own hamburger breakpoint (Tailwind's `sm`) — shared by
// every place that needs to default to a mobile-appropriate layout (a
// sidebar collapsed by default, an overlay instead of a push) on first
// render, before any resize listener would even be worth the complexity.
export function isMobileViewport(): boolean {
  return window.innerWidth < 640
}
