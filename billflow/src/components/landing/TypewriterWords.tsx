import { useEffect, useState } from 'react'

const TYPE_MS = 85
const DELETE_MS = 45
const HOLD_MS = 1600

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Types each word, holds, erases it, then moves to the next — forever.
// Purely visual (aria-hidden): callers render the full text for screen
// readers. Reduced-motion users get the static fallback instead.
function TypewriterWords({ words, fallback, className }: { words: string[]; fallback: string; className?: string }) {
  const [reduced] = useState(prefersReducedMotion)
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const word = words[index % words.length]

  useEffect(() => {
    if (reduced) return
    let delay = deleting ? DELETE_MS : TYPE_MS
    if (!deleting && length === word.length) delay = HOLD_MS
    const timer = setTimeout(() => {
      if (!deleting && length === word.length) setDeleting(true)
      else if (deleting && length === 0) {
        setDeleting(false)
        setIndex((prev) => (prev + 1) % words.length)
      } else setLength((prev) => prev + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(timer)
  }, [reduced, deleting, length, word, words.length])

  if (reduced) return <span className={className}>{fallback}</span>

  return (
    <span className={className} aria-hidden="true">
      {word.slice(0, length)}
      <span className="bf-caret ml-0.5 inline-block w-[3px] translate-y-[0.08em] self-stretch rounded-full bg-current align-baseline">
        &#8203;
      </span>
    </span>
  )
}

export default TypewriterWords
