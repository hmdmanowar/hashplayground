import { useEffect, useRef, useState, type RefObject } from 'react'
import { PlusIcon, ThinkIcon, MicIcon, ImageIcon, AttachIcon } from './icons'
import type { MicControls } from '../types'
import { toImageSrc } from '../utils'

export function Composer({
  input,
  onInputChange,
  onSend,
  isSending,
  textareaRef,
  mic,
  pendingImage,
  onAttachImage,
  onRemoveImage,
}: {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isSending: boolean
  textareaRef: RefObject<HTMLTextAreaElement>
  mic: MicControls
  pendingImage: string | undefined
  onAttachImage: (file: File) => void
  onRemoveImage: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input, textareaRef])

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSend()
      }}
      className="border-[var(--border-panel)] p-3"
    >
      {pendingImage && (
        <div className="relative mb-2 inline-block">
          <img src={toImageSrc(pendingImage)} alt="Attached" className="h-16 w-16 rounded-md object-cover" />
          <button
            type="button"
            onClick={onRemoveImage}
            aria-label="Remove attached image"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-panel)] text-xs text-[var(--text-app)] shadow"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-end gap-1.5 rounded-xl border border-[var(--border-panel)] bg-[var(--bg-app)] p-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onAttachImage(file)
            event.target.value = ''
          }}
        />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            title="Add"
            aria-label="Add"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <PlusIcon />
          </button>
          {menuOpen && (
            <div className="absolute bottom-10 left-0 z-10 w-56 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--bg-app)]"
              >
                <ImageIcon />
                <span className="flex flex-col">
                  <strong className="text-sm text-[var(--text-app)]">Add photos</strong>
                  <small className="text-xs text-[var(--color-muted)]">Upload from your computer</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--bg-app)]"
              >
                <AttachIcon />
                <span className="flex flex-col">
                  <strong className="text-sm text-[var(--text-app)]">Attach Files</strong>
                  <small className="text-xs text-[var(--color-muted)]">Upload from your computer</small>
                </span>
              </button>
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
          placeholder={mic.isListening ? 'Listening…' : 'Ask anything'}
          rows={1}
          autoFocus
          className="max-h-[200px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-[var(--text-app)] outline-none placeholder:text-[var(--color-muted)]"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            title="Extended reasoning — coming soon"
            className="flex items-center gap-1 rounded-full border border-[var(--border-panel)] px-2 py-1 text-xs text-[var(--color-muted)] opacity-50"
          >
            <ThinkIcon />
            Think
          </button>
          <button
            type="button"
            onClick={mic.toggle}
            disabled={!mic.isSupported}
            title={mic.isSupported ? (mic.isListening ? 'Stop listening' : 'Voice input') : 'Voice input is not supported in this browser'}
            aria-label={mic.isListening ? 'Stop listening' : 'Voice input'}
            className={`flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40 ${
              mic.isListening ? 'bg-red-500/20 text-red-500' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
            }`}
          >
            <MicIcon />
          </button>
          <button
            type="submit"
            disabled={isSending || (!input.trim() && !pendingImage)}
            aria-label="Send"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white disabled:opacity-40"
          >
            ↑
          </button>
        </div>
      </div>
    </form>
  )
}
