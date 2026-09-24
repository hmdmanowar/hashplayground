import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchInfo,
  sendMessage,
  resetConversation,
  listConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
  truncateConversation,
  type AssistantInfo,
  type ConversationSummary,
  type PendingApproval,
} from '../../services/assistantService'
import type { Message } from './types'
import { isGoodbye, downscaleImage } from './utils'
import { matchCommand, type AppCommand } from './commands'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../lib/apiClient'
import { useSidebarCollapsed } from './hooks/useSidebarCollapsed'
import { useAutoSpeak } from './hooks/useAutoSpeak'
import { usePersistentToggle } from './hooks/usePersistentToggle'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useWakeWord } from './hooks/useWakeWord'
import { Sidebar } from './components/Sidebar'
import { Composer } from './components/Composer'
import { EmptyState } from './components/EmptyState'
import { MessageList } from './components/MessageList'
import { ConfirmModal } from './components/ConfirmModal'
import HeroCanvas from '../../components/HeroCanvas/HeroCanvas'

// The client resends its own transcript only for an anonymous visitor (see
// sendMessage's `history` param) — capped independently of the server's own
// ANON_MAX_HISTORY so the request body stays small regardless of what the
// server does with it.
const ANON_HISTORY_LIMIT = 10

function LoginRequiredNotice() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-lg border border-[var(--color-primary-strong)] bg-[var(--bg-panel)] p-6 text-center shadow-xl">
        <p className="text-sm font-medium text-[var(--text-app)]">You've used your 5 free messages with Jarvis.</p>
        <p className="text-sm text-[var(--color-muted)]">
          Log in to keep chatting, plus unlock real file tools and conversations that save across visits.
        </p>
        <Link to="/login" className="rounded-md bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white">
          Log in to continue
        </Link>
      </div>
    </div>
  )
}

function JarvisChat() {
  const { user } = useAuth()
  const isAnonymous = !user
  const [info, setInfo] = useState<AssistantInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null)
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined)
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null)
  // Anonymous-only: how many free messages are left, and whether the server
  // has cut them off and wants a login before continuing.
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loginRequired, setLoginRequired] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed()
  const { enabled: autoSpeakEnabled, toggle: toggleAutoSpeak } = useAutoSpeak()
  const { value: wakeWordEnabled, setValue: setWakeWordEnabled, toggle: toggleWakeWord } = usePersistentToggle('jarvis-wake-word')
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Whatever was already typed before the mic was pressed — live speech
  // appends after it instead of overwriting it. Reset to empty whenever the
  // wake word triggers listening, since that always starts a fresh command.
  const micBaseTextRef = useRef('')
  const inputRef = useRef(input)
  inputRef.current = input

  const {
    isSupported: micSupported,
    isListening: isMicListening,
    start: startMic,
    stop: stopMic,
  } = useSpeechRecognition(
    (transcript) => {
      const base = micBaseTextRef.current
      setInput(base ? `${base} ${transcript}` : transcript)
    },
    () => {
      const text = inputRef.current.trim()
      if (text) handleSend(!isGoodbye(text))
    },
  )

  function toggleMic() {
    if (isMicListening) {
      stopMic()
      return
    }
    micBaseTextRef.current = input.trim()
    startMic()
  }

  function speakReply(text: string, onDone?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onDone?.()
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      onDone?.()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      onDone?.()
    }
    window.speechSynthesis.speak(utterance)
  }

  const wakeWordActive = wakeWordEnabled && micSupported && !isMicListening && !isSpeaking && !isSending
  const { permissionDenied: wakeWordPermissionDenied } = useWakeWord(`hey ${(info?.assistantName ?? 'jarvis').toLowerCase()}`, wakeWordActive, () => {
    micBaseTextRef.current = ''
    startMic()
  })

  useWakeWord('stop', micSupported && isSpeaking, () => {
    window.speechSynthesis.cancel()
    micBaseTextRef.current = ''
    startMic()
  })

  useEffect(() => {
    fetchInfo()
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not reach Jarvis'))
    // Conversation history only exists server-side for a logged-in account —
    // skip the call entirely for an anonymous visitor rather than let it 401.
    if (user) refreshConversations()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  function refreshConversations() {
    listConversations()
      .then(setConversations)
      .catch(() => {
        // Best-effort — a stale sidebar list isn't worth surfacing as an error.
      })
  }

  function applySuggestion(starter: string) {
    setInput(starter)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      el?.focus()
      el?.setSelectionRange(starter.length, starter.length)
    })
  }

  async function handleAttachImage(file: File) {
    try {
      const base64 = await downscaleImage(file)
      setPendingImage(base64)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach that image')
    }
  }

  async function sendText(text: string, fromVoice = false, images?: string[]) {
    if (!text || isSending || (isAnonymous && loginRequired)) return

    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString(), images }])
    setIsSending(true)
    setError('')

    // Only meaningful for an anonymous visitor — a logged-in conversation's
    // history already lives server-side, keyed by conversationId.
    const history = isAnonymous
      ? messages.slice(-ANON_HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }))
      : undefined

    try {
      const { reply, conversationId, pendingApproval: approval, remaining: remainingAfter } = await sendMessage(
        text,
        activeConversationId,
        images,
        history,
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }])
      setActiveConversationId(conversationId ?? undefined)
      setPendingApproval(approval)
      setRemaining(remainingAfter)
      if (user) refreshConversations()
      if (autoSpeakEnabled) {
        speakReply(reply, () => {
          if (fromVoice) startMic()
        })
      } else if (fromVoice) {
        startMic()
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LOGIN_REQUIRED') {
        setLoginRequired(true)
        setRemaining(0)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      setIsSending(false)
    }
  }

  async function handleSend(fromVoice = false) {
    const trimmed = input.trim()
    if ((!trimmed && !pendingImage) || isSending) return
    const text = trimmed || 'Describe this image.'

    const command = matchCommand(text)
    if (command) {
      setInput('')
      runCommand(command)
      return
    }

    setInput('')
    const images = pendingImage ? [pendingImage] : undefined
    setPendingImage(undefined)
    await sendText(text, fromVoice, images)
  }

  function runCommand(command: AppCommand) {
    switch (command.type) {
      case 'new-chat':
        handleNewChat()
        break
      case 'delete-conversation': {
        const active = conversations.find((c) => c.id === activeConversationId)
        if (active) setPendingDelete(active)
        break
      }
      case 'enable-voice-assistant':
        setWakeWordEnabled(true)
        break
      case 'disable-voice-assistant':
        setWakeWordEnabled(false)
        stopMic()
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
        setIsSpeaking(false)
        break
    }
  }

  async function handleEditMessage(index: number, newText: string) {
    if (!activeConversationId || isSending) return
    try {
      await truncateConversation(activeConversationId, index)
      setMessages((prev) => prev.slice(0, index))
      await sendText(newText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not edit message')
    }
  }

  async function handleNewChat() {
    try {
      // An anonymous chat has no server-side conversation to reset in the
      // first place (see sendText) — only clear it here.
      if (user) await resetConversation()
      setMessages([])
      setActiveConversationId(undefined)
      setPendingApproval(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a new conversation')
    }
  }

  async function handleSelectConversation(id: string) {
    if (id === activeConversationId || isSending) return
    try {
      const history = await getConversationMessages(id)
      setMessages(history.map((m) => ({ role: m.role, content: m.content, timestamp: m.createdAt, images: m.images })))
      setActiveConversationId(id)
      setPendingApproval(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch conversation')
    }
  }

  async function handleRenameConversation(id: string, title: string) {
    try {
      await renameConversation(id, title)
      refreshConversations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename conversation')
    }
  }

  async function confirmDeleteConversation() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setPendingDelete(null)
    try {
      await deleteConversation(id)
      if (id === activeConversationId) {
        setMessages([])
        setActiveConversationId(undefined)
      }
      refreshConversations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete conversation')
    }
  }

  async function handleApproval(approve: boolean) {
    setPendingApproval(null)
    await sendText(approve ? '/approve' : '/deny')
  }

  const isEmptyConversation = messages.length === 0 && !error
  const mic = { isSupported: micSupported, isListening: isMicListening, toggle: toggleMic }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 overflow-hidden opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
          }}
        >
          <div className="grid-glow" aria-hidden="true" />
        </div>
        <HeroCanvas />
      </div>

      <div className="relative flex h-full min-h-0 flex-1 overflow-hidden border border-[var(--border-panel)] backdrop-blur-[3px]">
      <Sidebar
        info={info}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={setPendingDelete}
        autoSpeakEnabled={autoSpeakEnabled}
        onToggleAutoSpeak={toggleAutoSpeak}
        wakeWordEnabled={wakeWordEnabled}
        onToggleWakeWord={toggleWakeWord}
        wakeWordSupported={micSupported}
        wakeWordPermissionDenied={wakeWordPermissionDenied}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {isEmptyConversation ? (
          <EmptyState
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            isSending={isSending}
            textareaRef={textareaRef}
            onApplySuggestion={applySuggestion}
            mic={mic}
            pendingImage={pendingImage}
            onAttachImage={handleAttachImage}
            onRemoveImage={() => setPendingImage(undefined)}
          />
        ) : (
          <>
            {/* MessageList's own root stays full-width so its scrollbar sits at
                main's true edge — the centered-column look lives inside it
                (see MessageList.tsx) instead of on this wrapper. */}
            <MessageList messages={messages} isSending={isSending} bottomRef={bottomRef} onEditMessage={handleEditMessage} />
            <div className="mx-auto w-full max-w-[65%]">
              {error && <p className="px-4 pb-2 text-sm text-red-500">{error}</p>}
              {isAnonymous && !loginRequired && remaining !== null && remaining <= 2 && (
                <p className="px-4 pb-2 text-xs text-[var(--color-muted)]">
                  {remaining === 0 ? 'Last free message.' : `${remaining} free message${remaining === 1 ? '' : 's'} left.`} Log in for unlimited chat.
                </p>
              )}
              {pendingApproval && (
                <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-lg border border-[var(--color-primary-strong)] bg-[var(--bg-panel)] px-3 py-2 text-sm">
                  <span className="text-[var(--text-app)]">
                    Jarvis wants to run <strong>{pendingApproval.tool}</strong> ({pendingApproval.risk} risk) — {JSON.stringify(pendingApproval.args)}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproval(false)}
                      className="rounded-md border border-[var(--border-panel)] px-2 py-1 text-xs hover:border-[var(--color-primary)]"
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval(true)}
                      className="rounded-md bg-[var(--color-primary-strong)] px-2 py-1 text-xs font-medium text-white"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}
              <Composer
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                isSending={isSending}
                textareaRef={textareaRef}
                mic={mic}
                pendingImage={pendingImage}
                onAttachImage={handleAttachImage}
                onRemoveImage={() => setPendingImage(undefined)}
              />
            </div>
          </>
        )}
      </main>
      </div>

      {isAnonymous && loginRequired && <LoginRequiredNotice />}

      {pendingDelete && (
        <ConfirmModal
          title="Delete conversation?"
          message={`"${pendingDelete.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteConversation}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

export default JarvisChat
