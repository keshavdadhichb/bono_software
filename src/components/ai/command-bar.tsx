"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  X,
  Trash2,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiAction {
  type: "navigate" | "prefill" | "data"
  payload: Record<string, unknown>
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  action?: AiAction | null
  createdAt?: string
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AiCommandBar() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Ctrl/Cmd + K
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  // Auto-focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Send message (with optional text override for quick chips)
  async function handleSendText(text?: string) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      // Build history from recent messages
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      })

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "I couldn't process that. Please try again.",
        action: data.action || null,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSend() {
    handleSendText()
  }

  // Handle action buttons
  function handleAction(action: AiAction) {
    const payload = action.payload
    switch (action.type) {
      case "navigate": {
        const url = (payload.url as string) || "/dashboard"
        router.push(url)
        setOpen(false)
        break
      }
      case "prefill": {
        const url = (payload.url as string) || "/dashboard"
        const params = payload.params as Record<string, string> | undefined
        if (params) {
          const searchParams = new URLSearchParams(params)
          router.push(`${url}?${searchParams.toString()}`)
        } else {
          router.push(url)
        }
        setOpen(false)
        break
      }
      case "data":
        // Data is already displayed inline
        break
    }
  }

  // Clear chat
  async function handleClear() {
    setMessages([])
    try {
      await fetch("/api/ai/history", { method: "DELETE" })
    } catch {
      // Silently fail — local state is already cleared
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          "transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30",
          "active:scale-95 md:bottom-6 md:right-6 md:size-12",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Open AI assistant"
      >
        <Sparkles className="size-5 animate-ai-sparkle" />
      </button>

      {/* Overlay + Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Chat panel */}
          <div
            className={cn(
              "relative z-10 flex w-full flex-col overflow-hidden",
              "bg-white/80 backdrop-blur-xl backdrop-saturate-150",
              "border border-white/40 shadow-2xl shadow-black/10",
              // Mobile: full width, bottom sheet style
              "h-[85dvh] rounded-t-2xl",
              // Desktop: sized panel on the right
              "md:h-[600px] md:max-h-[80dvh] md:w-[440px] md:rounded-2xl",
              "animate-ai-slide-up"
            )}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-tight">BonoStyle AI</h2>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Ask anything about your ERP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-muted-foreground"
                    title="Clear chat"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto scroll-smooth px-4 py-4"
            >
              {messages.length === 0 && !loading && (
                <EmptyState onQuickSend={handleSendText} />
              )}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onAction={handleAction}
                />
              ))}

              {loading && <TypingIndicator />}
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-black/[0.06] bg-white/50 px-3 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (Ctrl+K)"
                  disabled={loading}
                  className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                    input.trim() && !loading
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      : "text-muted-foreground/30"
                  )}
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] text-muted-foreground/40">
                  Powered by Gemini
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  Esc to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({ onQuickSend }: { onQuickSend: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.07]">
        <Bot className="size-6 text-primary/60" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground/70">
          How can I help you today?
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Ask about stock, orders, DCs, or navigate anywhere
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {[
          "What's our yarn stock?",
          "Show pending DCs",
          "Today's summary",
          "Go to fabric stock",
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQuickSend(q)}
            className="rounded-full border border-black/[0.06] bg-white px-3 py-1 text-[11px] text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/[0.04] hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onAction,
}: {
  message: ChatMessage
  onAction: (action: AiAction) => void
}) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-primary/10" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="size-3 text-primary" />
        ) : (
          <Bot className="size-3 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : "rounded-tl-md bg-black/[0.04] text-foreground"
          )}
        >
          <MessageContent content={message.content} />
        </div>

        {/* Action buttons */}
        {message.action && (
          <ActionButton action={message.action} onAction={onAction} />
        )}

        {/* Data display */}
        {message.action?.type === "data" && message.action.payload?.rows && (
          <DataTable rows={message.action.payload.rows as Record<string, unknown>[]} />
        )}
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering: bold, line breaks
  const parts = content.split("\n").map((line, i) => {
    // Bold: **text**
    const boldParsed = line.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="font-semibold">
          {segment}
        </strong>
      ) : (
        segment
      )
    )
    return (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {boldParsed}
      </React.Fragment>
    )
  })
  return <>{parts}</>
}

function ActionButton({
  action,
  onAction,
}: {
  action: AiAction
  onAction: (action: AiAction) => void
}) {
  if (action.type === "data") return null

  const label =
    action.type === "navigate"
      ? `Go to ${(action.payload.url as string)?.split("/").pop()?.replace(/-/g, " ") || "page"}`
      : action.type === "prefill"
        ? "Open & pre-fill form"
        : "View"

  const Icon = action.type === "navigate" ? ArrowRight : ExternalLink

  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.06] px-2.5 py-1.5",
        "text-xs font-medium text-primary transition-all",
        "hover:bg-primary/10 hover:border-primary/25 active:scale-[0.98]"
      )}
    >
      {label}
      <Icon className="size-3" />
    </button>
  )
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null
  const keys = Object.keys(rows[0]).slice(0, 5) // Max 5 columns

  return (
    <div className="mt-1 w-full max-w-full overflow-x-auto rounded-lg border border-black/[0.06] bg-white">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-black/[0.04] bg-muted/30">
            {keys.map((k) => (
              <th
                key={k}
                className="px-2 py-1.5 text-left font-medium text-muted-foreground capitalize"
              >
                {k.replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => (
            <tr key={i} className="border-b border-black/[0.02] last:border-0">
              {keys.map((k) => (
                <td key={k} className="px-2 py-1.5 text-foreground/80">
                  {String(row[k] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && (
        <div className="px-2 py-1 text-[10px] text-muted-foreground">
          +{rows.length - 8} more rows
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Bot className="size-3 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-black/[0.04] px-4 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-1.5 rounded-full bg-muted-foreground/40 animate-ai-dot-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
