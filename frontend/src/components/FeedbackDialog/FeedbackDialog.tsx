import { useRef, useState, type FormEvent } from 'react'
import { useToast } from '../../context/ToastContext'
import { submitFeedback, type FeedbackType } from '../../services/feedbackService'
import { UploadIcon, XIcon } from '../Icons/Icons'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [imageData, setImageData] = useState<string | undefined>(undefined)
  const [imageName, setImageName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  function resetAndClose() {
    setType('bug')
    setMessage('')
    setImageData(undefined)
    setImageName('')
    setError('')
    onClose()
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Attachment must be an image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large — please attach a screenshot under 3 MB.')
      return
    }

    setError('')
    setImageData(await readFileAsDataUrl(file))
    setImageName(file.name)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) {
      setError('Please describe the bug or feature you have in mind.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await submitFeedback({ type, message: message.trim(), imageData })
      showToast('Thanks for the feedback — the team will take a look.', { kind: 'success' })
      resetAndClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={resetAndClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="feedback-dialog-title" className="text-lg font-semibold">
          Share feedback
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Report a bug or request something new.</p>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            {(['bug', 'feature'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  type === option
                    ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--border-panel)] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                }`}
              >
                {option === 'bug' ? 'Report a bug' : 'Request a feature'}
              </button>
            ))}
          </div>

          <textarea
            className="min-h-28 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2.5 text-sm transition-colors"
            placeholder={
              type === 'bug'
                ? "What went wrong? Steps to reproduce help a lot."
                : 'What would you like Hash Playground to do?'
            }
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            autoFocus
          />

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imageData ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-2">
              <img src={imageData} alt="" className="h-12 w-12 rounded object-cover" />
              <span className="flex-1 truncate text-xs text-[var(--color-muted)]">{imageName}</span>
              <button
                type="button"
                onClick={() => {
                  setImageData(undefined)
                  setImageName('')
                }}
                aria-label="Remove attached image"
                className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 self-start rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <UploadIcon className="h-3.5 w-3.5" />
              Attach a screenshot
            </button>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FeedbackDialog
