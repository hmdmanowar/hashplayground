import { useState } from 'react'

type ContentSegment = { type: 'text'; text: string } | { type: 'code'; lang: string; code: string }

// Splits on fenced ```lang\ncode``` blocks so code can get its own
// monospace block with a copy button, instead of dumping everything as one
// plain-text blob — the single highest-value bit of "message formatting"
// for a coding-focused model, without pulling in a full markdown/highlight
// dependency chain.
function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  const regex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content))) {
    if (match.index > lastIndex) segments.push({ type: 'text', text: content.slice(lastIndex, match.index) })
    segments.push({ type: 'code', lang: match[1] || 'text', code: match[2].replace(/\n$/, '') })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < content.length) segments.push({ type: 'text', text: content.slice(lastIndex) })
  return segments
}

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

export function MessageBody({ content }: { content: string }) {
  const segments = parseContent(content)
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <CodeBlock key={index} lang={segment.lang} code={segment.code} />
        ) : (
          <p key={index} className="whitespace-pre-wrap text-sm text-[var(--text-app)]">
            {segment.text.trim()}
          </p>
        ),
      )}
    </>
  )
}
