import { useState, type ReactNode, type ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can be blocked — nothing to fall back to here.
    }
  }

  return (
    <div className="my-2 overflow-hidden rounded-md border border-[var(--border-panel)]">
      <div className="flex items-center justify-between bg-[var(--bg-app)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
        <span>{lang}</span>
        <button type="button" onClick={handleCopy} className="hover:text-[var(--color-primary)]">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[var(--bg-panel)] p-3 text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Renders a ```html code block as an actual live component instead of just
// text — a sandboxed iframe via srcDoc, same "allow-scripts" only (no
// allow-same-origin) sandboxing Playground's own PreviewPanel already uses,
// so the page can't reach cookies/storage/the parent frame regardless of
// what the model's HTML/JS does. Shown above the raw code, not instead of
// it — the model is prompted (see jarvisAssistant.session.ts) to answer
// "render a button/modal/card" requests with one self-contained,
// genuinely-interactive HTML block specifically so this has something real
// to show.
function LiveHtmlPreview({ html }: { html: string }) {
  const [hidden, setHidden] = useState(false)

  return (
    <div className="mb-2 overflow-hidden rounded-md border border-[var(--border-panel)]">
      <div className="flex items-center justify-between bg-[var(--bg-app)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
        <span>Live preview</span>
        <button type="button" onClick={() => setHidden((v) => !v)} className="hover:text-[var(--color-primary)]">
          {hidden ? 'Show' : 'Hide'}
        </button>
      </div>
      {!hidden && (
        <iframe
          sandbox="allow-scripts"
          srcDoc={html}
          title="Live preview"
          className="h-72 w-full resize-y overflow-auto border-0 bg-white"
        />
      )}
    </div>
  )
}

// A fenced ```lang\ncode``` block is always `pre > code` in the markdown
// AST — inline `code` (single backticks) never has a `pre` parent — so
// overriding `pre` (not `code`, which react-markdown v9+ no longer tells
// apart via an `inline` prop) is the reliable way to give fenced blocks
// their own styled component while leaving inline code alone.
function PreBlock({ children }: { children?: ReactNode }) {
  const codeElement = Array.isArray(children) ? children[0] : children
  const codeProps = (codeElement as ReactElement<{ className?: string; children?: ReactNode }> | undefined)?.props
  const match = /language-(\w+)/.exec(codeProps?.className ?? '')
  const lang = match?.[1] ?? 'text'
  const codeText = String(codeProps?.children ?? '').replace(/\n$/, '')
  return (
    <>
      {lang.toLowerCase() === 'html' && <LiveHtmlPreview html={codeText} />}
      <CodeBlock lang={lang} code={codeText} />
    </>
  )
}

export function MessageBody({ content }: { content: string }) {
  return (
    <div className="jarvis-markdown text-sm text-[var(--text-app)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: PreBlock,
          // `node` is react-markdown's internal AST node, not a real DOM
          // attribute — must be dropped, not spread, or it renders as a
          // stray node="[object Object]" attribute.
          code: ({ className, children, node: _node, ...rest }) => (
            <code className={`rounded bg-[var(--bg-app)] px-1 py-0.5 text-[0.85em] ${className ?? ''}`} {...rest}>
              {children}
            </code>
          ),
          p: ({ children }) => <p className="mb-2 whitespace-pre-wrap leading-relaxed last:mb-0">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-strong)]"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-[var(--text-app)]">{children}</strong>,
          h1: ({ children }) => <h1 className="mb-2 mt-3 text-lg font-semibold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0">{children}</h3>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-[var(--border-panel)] pl-3 text-[var(--color-muted)] last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-[var(--border-panel)]" />,
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto rounded-md border border-[var(--border-panel)] last:mb-0">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--bg-app)]">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-[var(--border-panel)] px-3 py-1.5 font-medium text-[var(--text-app)]">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-[var(--border-panel)] px-3 py-1.5 align-top">{children}</td>,
          tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
