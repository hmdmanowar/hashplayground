import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Message } from '../types'
import { formatTimestamp, toImageSrc } from '../utils'
import { MessageBody } from './MessageBody'
import { MessageActions } from './MessageActions'

function MessageImages({ images, onView }: { images: string[]; onView: (base64: string) => void }) {
  return (
    <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
      {images.map((base64, index) => (
        <img
          key={index}
          src={toImageSrc(base64)}
          alt="Attached"
          onClick={() => onView(base64)}
          className="h-24 w-24 cursor-pointer rounded-md object-cover"
        />
      ))}
    </div>
  )
}

function EditableUserBubble({
  content,
  onSave,
  onCancel,
}: {
  content: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true })
  }, [])

  function commit() {
    const text = draft.trim()
    if (text) onSave(text)
    else onCancel()
  }

  return (
    <div className="w-full max-w-[80%] rounded-lg border border-[var(--color-primary-strong)] bg-[var(--bg-panel)] p-2">
      <textarea
        ref={textareaRef}
        value={draft}
        rows={1}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            commit()
          }
          if (event.key === 'Escape') onCancel()
        }}
        className="w-full resize-none bg-transparent text-sm text-[var(--text-app)] outline-none"
      />
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-[var(--color-muted)] hover:text-[var(--text-app)]">
          Cancel
        </button>
        <button type="button" onClick={commit} className="text-xs font-medium text-[var(--color-primary-strong)]">
          Save & submit
        </button>
      </div>
    </div>
  )
}

export function MessageList({
  messages,
  isSending,
  bottomRef,
  onEditMessage,
}: {
  messages: Message[]
  isSending: boolean
  bottomRef: RefObject<HTMLDivElement>
  onEditMessage: (index: number, newText: string) => void
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // Leaving a message mid-edit and switching conversations swaps the whole
  // `messages` array out from under this component without ever calling
  // onSave/onCancel — without this, the leftover editingIndex would make
  // some unrelated message in the newly loaded conversation render as
  // "being edited" just because it happens to share that index.
  useEffect(() => {
    setEditingIndex(null)
  }, [messages])

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <div key={index}>
          {message.role === 'user' && (
            <div className="mb-1 text-right text-xs text-[var(--color-muted)]">{formatTimestamp(message.timestamp)}</div>
          )}
          {message.role === 'user' ? (
            <div className="flex justify-end">
              <div className="flex max-w-[80%] flex-col items-end">
                {editingIndex === index ? (
                  <EditableUserBubble
                    content={message.content}
                    onCancel={() => setEditingIndex(null)}
                    onSave={(text) => {
                      setEditingIndex(null)
                      onEditMessage(index, text)
                    }}
                  />
                ) : (
                  <>
                    {message.images && message.images.length > 0 && <MessageImages images={message.images} onView={setViewingImage} />}
                    <div className="whitespace-pre-wrap rounded-lg bg-[var(--color-primary-strong)] px-3 py-2 text-sm text-white">
                      {message.content}
                    </div>
                    <MessageActions content={message.content} onEdit={() => setEditingIndex(index)} />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <MessageBody content={message.content} />
                <MessageActions content={message.content} />
              </div>
            </div>
          )}
        </div>
      ))}

      {isSending && (
        <div className="flex justify-start">
          <span className="flex gap-1 rounded-lg bg-[var(--bg-app)] px-3 py-2">
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:-0.3s]" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:-0.15s]" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)]" />
          </span>
        </div>
      )}

      <div ref={bottomRef} />

      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setViewingImage(null)}
        >
          <img src={toImageSrc(viewingImage)} alt="Attached, full size" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
