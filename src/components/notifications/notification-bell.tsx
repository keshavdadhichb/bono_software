"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, BellRing, AlertCircle, Package, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  type: "overdue" | "stock"
  message: string
  time: string
}

function getRelativeTime(timeStr: string): string {
  const now = new Date()
  const then = new Date(timeStr)
  if (isNaN(then.getTime())) return timeStr
  const diffMs = now.getTime() - then.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  return "just now"
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  async function fetchNotifications() {
    try {
      setLoading(true)
      const res = await fetch("/api/dashboard")
      if (!res.ok) return
      const data = await res.json()
      const fetched: Notification[] = (data.notifications ?? []).slice(0, 10)
      setNotifications(fetched)
      setUnreadCount(fetched.length)
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleMarkAllRead() {
    setUnreadCount(0)
  }

  const BellIcon = unreadCount > 0 ? BellRing : Bell

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
        aria-label="Notifications"
      >
        <BellIcon
          className={[
            "size-[18px]",
            unreadCount > 0 ? "animate-[bell-ring_0.5s_ease-in-out_infinite_alternate]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline focus:outline-none"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Check className="size-8 text-green-500" />
                <span className="text-sm">No new notifications</span>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n, idx) => (
                  <li key={idx} className="flex gap-3 px-4 py-3 hover:bg-accent/50">
                    {/* Icon badge */}
                    <div
                      className={[
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        n.type === "overdue"
                          ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                      ].join(" ")}
                    >
                      {n.type === "overdue" ? (
                        <AlertCircle className="size-4" />
                      ) : (
                        <Package className="size-4" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-foreground">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {getRelativeTime(n.time)}
                      </p>
                    </div>

                    {/* Type badge */}
                    <span
                      className={[
                        "mt-0.5 shrink-0 self-start rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
                        n.type === "overdue"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                      ].join(" ")}
                    >
                      {n.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bell-ring {
          0% { transform: rotate(-10deg); }
          100% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  )
}
