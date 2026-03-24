"use client"

import * as React from "react"
import { Keyboard, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  items: ShortcutItem[]
}

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

const SHORTCUTS: ShortcutSection[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Ctrl", "/"], description: "Open spotlight search" },
      { keys: ["Ctrl", "K"], description: "Open AI assistant" },
    ],
  },
  {
    title: "Common Actions",
    items: [
      { keys: ["N"], description: "New entry (on list pages)" },
      { keys: ["P"], description: "Print current view" },
      { keys: ["E"], description: "Export to Excel / CSV" },
    ],
  },
  {
    title: "Tables & Dialogs",
    items: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Enter"], description: "Open detail / confirm" },
      { keys: ["Esc"], description: "Close dialog / cancel" },
    ],
  },
]

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface KeyboardShortcutsContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const KeyboardShortcutsContext =
  React.createContext<KeyboardShortcutsContextValue>({
    open: false,
    setOpen: () => {},
  })

export function useKeyboardShortcuts() {
  return React.useContext(KeyboardShortcutsContext)
}

// ---------------------------------------------------------------------------
// KeyboardShortcutsDialog
// ---------------------------------------------------------------------------

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = React.useState(false)

  // Open on `?` key when not focused in an input/textarea
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable

      if (e.key === "?" && !isEditable && !e.metaKey && !e.ctrlKey) {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl shadow-2xl",
          "bg-white border border-black/[0.08]",
          "overflow-hidden"
        )}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Keyboard className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-muted-foreground/70 leading-tight">
                Press <KbdKey>?</KbdKey> anywhere to toggle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-muted-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="divide-y divide-black/[0.05] px-5 py-3">
          {SHORTCUTS.map((section) => (
            <div key={section.title} className="py-3 first:pt-1">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {section.title}
              </p>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-[13px] text-foreground/80">
                      {item.description}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          {i > 0 && (
                            <span className="text-[10px] text-muted-foreground/40">
                              +
                            </span>
                          )}
                          <KbdKey>{key}</KbdKey>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-black/[0.06] bg-muted/30 px-5 py-3">
          <p className="text-center text-[11px] text-muted-foreground/50">
            More shortcuts coming soon · Press{" "}
            <KbdKey>Esc</KbdKey> to close
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KbdKey helper
// ---------------------------------------------------------------------------

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-black/[0.12] bg-muted px-2 py-0.5 text-[11px] font-mono text-foreground/70 shadow-sm">
      {children}
    </kbd>
  )
}
