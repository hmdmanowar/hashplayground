import type { AssistantInfo, ConversationSummary } from '../../../services/assistantService'
import { PanelIcon, ComposeIcon, SpeakerIcon, SpeakerOffIcon, MicIcon } from './icons'
import { ConversationRow } from './ConversationRow'

export function Sidebar({
  info,
  collapsed,
  onToggleCollapsed,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  autoSpeakEnabled,
  onToggleAutoSpeak,
  wakeWordEnabled,
  onToggleWakeWord,
  wakeWordSupported,
  wakeWordPermissionDenied,
}: {
  info: AssistantInfo | null
  collapsed: boolean
  onToggleCollapsed: () => void
  conversations: ConversationSummary[]
  activeConversationId: string | undefined
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onDeleteConversation: (conversation: ConversationSummary) => void
  autoSpeakEnabled: boolean
  onToggleAutoSpeak: () => void
  wakeWordEnabled: boolean
  onToggleWakeWord: () => void
  wakeWordSupported: boolean
  wakeWordPermissionDenied: boolean
}) {
  const assistantName = info?.assistantName ?? 'Jarvis'
  const wakeWordTitle = wakeWordPermissionDenied
    ? 'Microphone permission was denied — allow it in your browser to use the wake word'
    : !wakeWordSupported
      ? 'Wake word is not supported in this browser'
      : wakeWordEnabled
        ? `Wake word on — say "Hey ${assistantName}" to start listening`
        : `Turn on wake word ("Hey ${assistantName}")`

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[var(--border-panel)] ${collapsed ? 'w-16 items-center py-2' : 'w-64 p-2'}`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-1 py-1'}`}>
        {!collapsed && <span className="text-sm font-semibold text-[var(--text-app)]">{assistantName}</span>}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          <PanelIcon />
        </button>
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          className="mt-2 flex h-8 w-8 items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          <ComposeIcon />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onNewChat}
            className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-[var(--text-app)] hover:bg-[var(--bg-app)]"
          >
            + New chat
          </button>
          <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto">
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeConversationId}
                onSelect={() => onSelectConversation(conversation.id)}
                onRename={(title) => onRenameConversation(conversation.id, title)}
                onDelete={() => onDeleteConversation(conversation)}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 border-t border-[var(--border-panel)] pt-2">
            {info && <span className="mr-auto truncate text-xs text-[var(--color-muted)]">{info.model}</span>}
            <button
              type="button"
              onClick={onToggleWakeWord}
              disabled={!wakeWordSupported || wakeWordPermissionDenied}
              aria-label={wakeWordEnabled ? 'Turn off wake word' : 'Turn on wake word'}
              title={wakeWordTitle}
              className={`flex h-8 w-8 items-center justify-center rounded disabled:opacity-40 ${
                wakeWordEnabled ? 'text-[var(--color-primary-strong)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
              }`}
            >
              <MicIcon />
            </button>
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              aria-label={autoSpeakEnabled ? 'Turn off auto-speak replies' : 'Turn on auto-speak replies'}
              title={autoSpeakEnabled ? 'Auto-speak replies: on' : 'Auto-speak replies: off'}
              className={`flex h-8 w-8 items-center justify-center rounded ${
                autoSpeakEnabled ? 'text-[var(--color-primary-strong)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
              }`}
            >
              {autoSpeakEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
