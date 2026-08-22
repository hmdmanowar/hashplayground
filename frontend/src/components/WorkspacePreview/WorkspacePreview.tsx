import { useEffect, useRef, useState } from 'react'
import { PlayIcon } from '../Icons/Icons'

const FILES = [
  { name: 'src', active: false },
  { name: 'App.tsx', active: true },
  { name: 'Button.tsx', active: false },
  { name: 'styles.css', active: false },
  { name: 'package.json', active: false },
]

const CODE_LINES = [
  { keyword: 'import', rest: " { useState } from 'react'" },
  { keyword: '', rest: '' },
  { keyword: 'function', rest: ' Counter() {' },
  { keyword: '  const', rest: ' [count, setCount] = useState(0)' },
  { keyword: '', rest: '' },
  { keyword: '  return', rest: ' <Button onClick={() => setCount(count + 1)}>' },
  { keyword: '', rest: '    Clicked {count} times' },
  { keyword: '  ', rest: '  </Button>' },
  { keyword: '}', rest: '' },
]

const LINE_LENGTHS = CODE_LINES.map((line) => line.keyword.length + line.rest.length)
const LINE_STARTS: number[] = []
{
  let running = 0
  for (const length of LINE_LENGTHS) {
    LINE_STARTS.push(running)
    running += length
  }
}
const TOTAL_LENGTH = LINE_LENGTHS.reduce((sum, length) => sum + length, 0)

const MS_PER_CHAR = 28

// A small looping "it's actually running" demo — not a screen recording,
// but genuinely reflects the real workflow (write code, run it, click the
// live preview) rather than a static screenshot. Respects
// prefers-reduced-motion by settling on the finished state and staying there.
function WorkspacePreview() {
  const [typedChars, setTypedChars] = useState(0)
  const [clickCount, setClickCount] = useState(0)
  const [pressed, setPressed] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setTypedChars(TOTAL_LENGTH)
      return
    }

    function schedule(fn: () => void, delay: number) {
      timeoutsRef.current.push(setTimeout(fn, delay))
    }

    function runCycle() {
      setTypedChars(0)
      setClickCount(0)
      setPressed(false)

      let charIndex = 0
      const typeNext = () => {
        charIndex += 1
        setTypedChars(charIndex)
        if (charIndex < TOTAL_LENGTH) {
          schedule(typeNext, MS_PER_CHAR)
        } else {
          schedule(clickOnce(1), 500)
        }
      }

      function clickOnce(n: number) {
        return () => {
          setPressed(true)
          setClickCount(n)
          schedule(() => setPressed(false), 150)
          if (n < 2) {
            schedule(clickOnce(n + 1), 900)
          } else {
            schedule(runCycle, 2200)
          }
        }
      }

      schedule(typeNext, MS_PER_CHAR)
    }

    runCycle()
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  const isTyping = typedChars < TOTAL_LENGTH

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Product preview</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Your whole workflow, in one tab</h2>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            </div>
            <span className="font-mono text-xs text-[var(--color-muted)]">src / App.tsx</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-strong)] px-3 py-1 text-xs font-medium text-white">
            <PlayIcon className="h-3 w-3" />
            Run
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_1fr]">
          <div className="border-b border-[var(--border-panel)] p-4 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Files</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {FILES.map((file) => (
                <li
                  key={file.name}
                  className={`rounded px-2 py-1 ${file.active ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
                >
                  {file.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-[var(--border-panel)] bg-[var(--bg-app)] p-4 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Code editor</p>
            <div className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed">
              {CODE_LINES.map((line, index) => {
                const visibleInLine = Math.min(Math.max(typedChars - LINE_STARTS[index], 0), LINE_LENGTHS[index])
                const visibleKeyword = line.keyword.slice(0, Math.min(visibleInLine, line.keyword.length))
                const visibleRest = line.rest.slice(0, Math.max(0, visibleInLine - line.keyword.length))
                const isCursorLine = isTyping && visibleInLine > 0 && visibleInLine < LINE_LENGTHS[index]
                const isCursorAtLineStart = isTyping && typedChars === LINE_STARTS[index] && LINE_LENGTHS[index] > 0

                return (
                  <div key={index} className="flex gap-3">
                    <span className="w-4 shrink-0 select-none text-right text-[var(--color-muted)]">{index + 1}</span>
                    <span>
                      <span className="font-medium text-[var(--color-primary)]">{visibleKeyword}</span>
                      <span className="text-[var(--text-app)]">{visibleRest}</span>
                      {(isCursorLine || isCursorAtLineStart) && (
                        <span className="ml-px inline-block h-3 w-1.5 animate-pulse bg-[var(--color-primary)] align-middle" />
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Preview</p>
            <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-6 text-center">
              <p className="text-sm transition-transform duration-150" style={{ transform: pressed ? 'scale(1.08)' : 'scale(1)' }}>
                Clicked {clickCount} times
              </p>
              <span
                className="rounded-full bg-[var(--color-primary-strong)] px-4 py-1.5 text-xs font-medium text-white transition-transform duration-150"
                style={{ transform: pressed ? 'scale(0.94)' : 'scale(1)' }}
              >
                Click me
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
          <p>$ npm run dev</p>
          <p>&#10003; compiled successfully</p>
          <p>
            &#10148; Local: http://localhost:5173/
            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-[var(--color-muted)] align-middle" />
          </p>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePreview
