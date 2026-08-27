// Simplified, recognizable marks in each framework's real brand color — not
// pixel-exact logo reproductions, same idiom as the homepage's
// TechStackTicker. Shared between CreateProject and the Playground's
// retroactive "Add Style Template" dialog.

export function BootstrapMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9">
      <rect width="40" height="40" rx="8" fill="#7952B3" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui"
        fontSize="17"
        fontWeight="700"
        fill="#fff"
      >
        B
      </text>
    </svg>
  )
}

// Not a brand mark — the "no framework" option in the style-template
// pickers, styled to read as a deliberate opt-out rather than a logo.
export function NoneMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-[var(--border-panel)] text-[var(--color-muted)]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </span>
  )
}

export function TailwindMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9">
      <path
        fill="#38BDF8"
        d="M20 12c-4.4 0-7.2 2.2-8.3 6.5 1.7-2.2 3.6-3 5.8-2.5 1.3.3 2.2 1.2 3.2 2.2 1.7 1.7 3.6 3.6 7.8 3.6 4.4 0 7.2-2.2 8.3-6.5-1.7 2.2-3.6 3-5.8 2.5-1.3-.3-2.2-1.2-3.2-2.2C26.1 13.9 24.2 12 20 12Z"
      />
      <path
        fill="#38BDF8"
        d="M11.7 21.8c-4.4 0-7.2 2.2-8.3 6.5 1.7-2.2 3.6-3 5.8-2.5 1.3.3 2.2 1.2 3.2 2.2 1.7 1.7 3.6 3.6 7.8 3.6 4.4 0 7.2-2.2 8.3-6.5-1.7 2.2-3.6 3-5.8 2.5-1.3-.3-2.2-1.2-3.2-2.2-1.7-1.7-3.6-3.6-7.8-3.6Z"
      />
    </svg>
  )
}
