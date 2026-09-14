import { useEffect, useRef, useState } from "react";
import { MenuUnfoldIcon, MenuFoldIcon, BotIcon } from "../../../components/Icons/Icons";
import { sendAssistantMessage, resetAssistantSession, type PendingApproval } from "../../../services/projectAssistantService";
import { ApiError } from "../../../lib/apiClient";
import { MessageBody } from "../../JarvisChat/components/MessageBody";
import { MessageActions } from "../../JarvisChat/components/MessageActions";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantPanelProps {
  mobileHidden: boolean;
  collapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  width: number;
  projectId: string;
}

// A project-scoped Jarvis panel — same collapsible-rail mechanics as
// PreviewPanel, but with real (Prisma-backed) file tools scoped to this
// project instead of a live preview. Chat history is in-memory only, both
// here and on the backend session it talks to (see
// projectAssistant.session.ts) — it resets on a page reload, same tradeoff
// the personal assistant's own session cache accepts.
function AssistantPanel({ mobileHidden, collapsed, onExpand, onCollapse, width, projectId }: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // A different project means a different backend session — nothing here
  // carries over.
  useEffect(() => {
    setMessages([]);
    setInput("");
    setError("");
    setPendingApproval(null);
  }, [projectId]);

  async function sendText(text: string) {
    if (!text || isSending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);
    setError("");
    try {
      const { reply, pendingApproval: approval } = await sendAssistantMessage(projectId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setPendingApproval(approval);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    void sendText(trimmed);
  }

  async function handleNewChat() {
    try {
      await resetAssistantSession(projectId);
    } catch {
      // Best-effort — clearing the local transcript below is what actually matters.
    }
    setMessages([]);
    setPendingApproval(null);
    setError("");
  }

  async function handleApproval(approve: boolean) {
    setPendingApproval(null);
    await sendText(approve ? "/approve" : "/deny");
  }

  return (
    <div
      style={{ "--panel-width": `${collapsed ? 40 : width}px` } as React.CSSProperties}
      className={`${mobileHidden ? "hidden" : "flex"} w-full flex-col overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] lg:flex lg:w-[var(--panel-width)] lg:shrink-0 ${
        collapsed ? "items-center p-1.5" : ""
      }`}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand Jarvis panel"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          <MenuUnfoldIcon className="h-4 w-4" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border-panel)] px-3 py-1.5">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              <BotIcon className="h-3.5 w-3.5" />
              Jarvis
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-full px-2 py-1 text-[10px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                New chat
              </button>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse Jarvis panel"
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                <MenuFoldIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {messages.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">
                  Ask Jarvis to read, write, or clean up files in this project.
                </p>
              )}
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-[var(--color-primary-strong)] px-2.5 py-1.5 text-xs text-white">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div key={index} className="max-w-[95%]">
                    <MessageBody content={message.content} />
                    <MessageActions content={message.content} />
                  </div>
                ),
              )}
              {isSending && <p className="text-xs text-[var(--color-muted)]">Thinking…</p>}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-3 pb-2 text-xs text-red-500">{error}</p>}

            {pendingApproval && (
              <div className="mx-3 mb-2 flex flex-col gap-2 rounded-lg border border-[var(--color-primary-strong)] bg-[var(--bg-app)] p-2 text-xs">
                <span className="text-[var(--text-app)]">
                  Run <strong>{pendingApproval.tool}</strong> ({pendingApproval.risk} risk) — {JSON.stringify(pendingApproval.args)}
                </span>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproval(false)}
                    className="rounded-md border border-[var(--border-panel)] px-2 py-1 hover:border-[var(--color-primary)]"
                  >
                    Deny
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproval(true)}
                    className="rounded-md bg-[var(--color-primary-strong)] px-2 py-1 font-medium text-white"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-1.5 border-t border-[var(--border-panel)] p-2"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Jarvis…"
                rows={1}
                className="max-h-24 flex-1 resize-none rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1.5 text-xs text-[var(--text-app)] outline-none focus:border-[var(--color-primary-strong)]"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white disabled:opacity-40"
              >
                ↑
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default AssistantPanel;
