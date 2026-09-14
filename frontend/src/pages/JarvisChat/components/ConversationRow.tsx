import { useState, type MouseEvent } from 'react'
import type { ConversationSummary } from '../../../services/assistantService'

export function ConversationRow({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: ConversationSummary
  active: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(conversation.title)

  function startEditing(event: MouseEvent) {
    event.stopPropagation()
    setDraft(conversation.title)
    setIsEditing(true)
  }

  function commitEdit() {
    const title = draft.trim()
    setIsEditing(false)
    if (title && title !== conversation.title) onRename(title)
  }

  return (
    <div
      onClick={isEditing ? undefined : onSelect}
      className={`group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
        active ? 'bg-[var(--bg-app)] text-[var(--text-app)]' : 'text-[var(--color-muted)] hover:bg-[var(--bg-app)]'
      }`}
    >
      {isEditing ? (
        <input
          className="min-w-0 flex-1 rounded border border-[var(--color-primary-strong)] bg-[var(--bg-panel)] px-1 py-0.5 text-sm text-[var(--text-app)] outline-none"
          value={draft}
          autoFocus
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitEdit()
            if (event.key === 'Escape') setIsEditing(false)
          }}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
      )}
      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100" style={isEditing ? { visibility: 'hidden' } : undefined}>
        <button type="button" onClick={startEditing} aria-label="Rename conversation" className="hover:text-[var(--color-primary)]">
          ✎
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          aria-label="Delete conversation"
          className="hover:text-red-500"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
