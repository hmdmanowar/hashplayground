import { useState, type ReactNode } from 'react'

interface AccordionProps {
  title: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

function Accordion({ title, defaultOpen = true, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-sm font-medium text-inherit hover:text-[var(--color-primary)]"
      >
        {title}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

export default Accordion
