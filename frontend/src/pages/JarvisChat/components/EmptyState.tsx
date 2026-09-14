import type { RefObject } from 'react'
import { Composer } from './Composer'
import { ComposeIcon, SearchIcon } from './icons'
import type { MicControls } from '../types'

export function EmptyState({
  input,
  onInputChange,
  onSend,
  isSending,
  textareaRef,
  onApplySuggestion,
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
  onApplySuggestion: (starter: string) => void
  mic: MicControls
  pendingImage: string | undefined
  onAttachImage: (file: File) => void
  onRemoveImage: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
      <p className="text-xl font-medium text-[var(--text-app)]">How can I help you today?</p>
      <div className="w-full max-w-xl">
        <Composer
          input={input}
          onInputChange={onInputChange}
          onSend={onSend}
          isSending={isSending}
          textareaRef={textareaRef}
          mic={mic}
          pendingImage={pendingImage}
          onAttachImage={onAttachImage}
          onRemoveImage={onRemoveImage}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {/* Mapped to real Jarvis capabilities only — no "Search the web" chip
            since there's no web-search tool, unlike a literal ChatGPT clone. */}
        <button
          type="button"
          onClick={() => onApplySuggestion('Help me write ')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] px-3 py-1.5 text-sm text-[var(--text-app)] hover:border-[var(--color-primary)]"
        >
          <ComposeIcon />
          Write or edit
        </button>
        <button
          type="button"
          onClick={() => onApplySuggestion('Search my workspace files for ')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] px-3 py-1.5 text-sm text-[var(--text-app)] hover:border-[var(--color-primary)]"
        >
          <SearchIcon />
          Search my files
        </button>
      </div>
    </div>
  )
}
