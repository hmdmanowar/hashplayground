import { useState, type ReactNode } from 'react'

interface AccordionProps {
  title: ReactNode
  defaultOpen?: boolean
  // Uncontrolled by default (own internal state, as before). Pass both
  // `open` and `onToggle` to drive it externally instead — e.g. a wizard
  // that keeps exactly one section open at a time.
  open?: boolean
  onToggle?: () => void
  children: ReactNode
}

function Accordion({ title, defaultOpen = true, open: controlledOpen, onToggle, children }: AccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function handleClick() {
    if (isControlled) {
      onToggle?.()
    } else {
      setInternalOpen((prev) => !prev)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-sm font-medium text-inherit hover:text-[var(--color-primary)]"
      >
        {title}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

export default Accordion
