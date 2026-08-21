import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '../Icons/Icons'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

function Select({ value, options, onChange, className }: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find((option) => option.value === value)

  return (
    <div className={`relative inline-block ${className ?? ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-[10rem] cursor-pointer items-center justify-between gap-2 rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1 text-sm transition-colors hover:border-[var(--color-primary)]"
      >
        <span className="truncate">{selected?.label ?? 'Select...'}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-2 max-h-60 w-full min-w-[10rem] overflow-y-auto rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`w-full cursor-pointer truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--text-app)] hover:bg-[var(--hover-overlay)]'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Select
