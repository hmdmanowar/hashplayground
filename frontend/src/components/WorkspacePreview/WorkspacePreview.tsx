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

function WorkspacePreview() {
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
              {CODE_LINES.map((line, index) => (
                <div key={index} className="flex gap-3">
                  <span className="w-4 shrink-0 select-none text-right text-[var(--color-muted)]">{index + 1}</span>
                  <span>
                    <span className="font-medium text-[var(--color-primary)]">{line.keyword}</span>
                    <span className="text-[var(--text-app)]">{line.rest}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Preview</p>
            <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-6 text-center">
              <p className="text-sm">Clicked 0 times</p>
              <span className="rounded-full bg-[var(--color-primary-strong)] px-4 py-1.5 text-xs font-medium text-white">
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
