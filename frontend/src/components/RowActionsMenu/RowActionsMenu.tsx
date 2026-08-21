import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVerticalIcon } from '../Icons/Icons'

export const menuItemClass =
  'flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'
export const menuItemDangerClass =
  'flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'
export const menuIconClass = 'h-4 w-4 shrink-0'

interface MenuPosition {
  left: number
  top?: number
  bottom?: number
}

function RowActionsMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuWidth = 192
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const spaceBelow = window.innerHeight - rect.bottom
      const flipUp = spaceBelow < menuHeight + 8 && rect.top - 4 > menuHeight
      setPosition(
        flipUp ? { left, bottom: window.innerHeight - rect.top + 4 } : { left, top: rect.bottom + 4 },
      )
    }

    updatePosition()

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    // Reposition (not close) on scroll/resize — a fixed-position menu would
    // otherwise drift from its anchor as the page scrolls, and closing outright
    // is too eager: browsers also fire these for spurious layout settling
    // (e.g. a scrollbar appearing/disappearing) with no actual user scroll.
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Actions"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
      >
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', top: position.top, bottom: position.bottom, left: position.left, width: 192 }}
          className="z-50 flex flex-col gap-0.5 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 shadow-lg"
        >
          {children}
        </div>
      )}
    </>
  )
}

export default RowActionsMenu
