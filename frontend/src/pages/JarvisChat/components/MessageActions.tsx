import { useState } from 'react'
import { CopyIcon, ShareIcon, EditIcon, SpeakerIcon, SpeakerOffIcon } from './icons'

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function MessageActions({ content, onEdit }: { content: string; onEdit?: () => void }) {
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  function handleSpeak() {
    if (!speechSupported) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    window.speechSynthesis.cancel() // stop anything already speaking elsewhere on the page
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can be blocked — nothing to fall back to here.
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: content })
        return
      } catch {
        // User cancelled, or the platform rejected it — fall through.
      }
    }
    await handleCopy()
  }

  return (
    <div className="mt-1 flex items-center gap-2 text-[var(--color-muted)]">
      <button type="button" onClick={handleCopy} aria-label="Copy" title="Copy" className="flex items-center gap-1 rounded p-1 hover:text-[var(--color-primary)]">
        <CopyIcon />
        {copied && <span className="text-xs">Copied</span>}
      </button>
      <button type="button" onClick={handleShare} aria-label="Share" title="Share" className="rounded p-1 hover:text-[var(--color-primary)]">
        <ShareIcon />
      </button>
      {speechSupported && (
        <button
          type="button"
          onClick={handleSpeak}
          aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
          title={isSpeaking ? 'Stop' : 'Listen'}
          className="rounded p-1 hover:text-[var(--color-primary)]"
        >
          {isSpeaking ? <SpeakerOffIcon /> : <SpeakerIcon />}
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label="Edit" title="Edit" className="rounded p-1 hover:text-[var(--color-primary)]">
          <EditIcon />
        </button>
      )}
    </div>
  )
}
