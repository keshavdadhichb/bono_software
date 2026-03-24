"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Command,
  LayoutDashboard,
  Database,
  Layers,
  Shirt,
  Package,
  BarChart3,
  ArrowRight,
  FileText,
  Users,
  Box,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageResult {
  label: string
  href: string
  description: string
}

interface PartyResult {
  id: string
  partyName: string
  partyType: string
}

interface StockResult {
  id: string
  counts: string
  yarnType: string
  stockKgs: number
  storeId: string
  lotNo: string
  color: string | null
}

interface SearchResults {
  pages: PageResult[]
  parties: PartyResult[]
  stock: StockResult[]
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SpotlightContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SpotlightContext = React.createContext<SpotlightContextValue>({
  open: false,
  setOpen: () => {},
})

export function useSpotlight() {
  return React.useContext(SpotlightContext)
}

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SpotlightContext.Provider value={{ open, setOpen }}>
      {children}
    </SpotlightContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Quick nav pages (shown when query is empty)
// ---------------------------------------------------------------------------

const QUICK_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Parties", href: "/master/parties", icon: Users },
  { label: "Yarn Stock", href: "/yarn/stock", icon: Database },
  { label: "Fabric Stock", href: "/fabric/stock", icon: Layers },
  { label: "Garment Stock", href: "/garment/stock", icon: Shirt },
  { label: "Accessory Stock", href: "/accessory/stock", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
]

// Icon resolver for page results
function getPageIcon(href: string) {
  if (href === "/dashboard") return LayoutDashboard
  if (href.startsWith("/master/parties")) return Users
  if (href.startsWith("/master")) return FileText
  if (href.startsWith("/yarn/stock")) return Database
  if (href.startsWith("/yarn")) return Database
  if (href.startsWith("/fabric/stock")) return Layers
  if (href.startsWith("/fabric")) return Layers
  if (href.startsWith("/garment/stock")) return Shirt
  if (href.startsWith("/garment")) return Shirt
  if (href.startsWith("/accessory/stock")) return Package
  if (href.startsWith("/accessory")) return Package
  if (href.startsWith("/reports")) return BarChart3
  if (href.startsWith("/admin")) return Users
  return FileText
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// SpotlightSearch (the modal)
// ---------------------------------------------------------------------------

export function SpotlightSearch() {
  const { open, setOpen } = useSpotlight()
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResults | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 200)

  // Keyboard shortcut: Ctrl+/ or Cmd+/
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus on open
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Fetch results when debounced query changes
  React.useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        setResults(data)
        setSelectedIndex(0)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [debouncedQuery])

  // Flatten all results for keyboard navigation
  const flatResults = React.useMemo<Array<{ href: string; type: string }>>(() => {
    if (!results) return []
    const items: Array<{ href: string; type: string }> = []
    if (query.trim() === "") {
      QUICK_NAV.forEach((p) => items.push({ href: p.href, type: "quick" }))
    } else {
      results.pages.forEach((p) => items.push({ href: p.href, type: "page" }))
      results.parties.forEach((p) =>
        items.push({ href: `/master/parties`, type: "party" })
      )
      results.stock.forEach((s) =>
        items.push({ href: `/yarn/stock`, type: "stock" })
      )
    }
    return items
  }, [results, query])

  function handleClose() {
    setOpen(false)
    setQuery("")
  }

  function navigate(href: string) {
    router.push(href)
    handleClose()
  }

  // Keyboard navigation within list
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (flatResults[selectedIndex]) {
        navigate(flatResults[selectedIndex].href)
      }
    }
  }

  // Scroll selected item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-idx="${selectedIndex}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!open) return null

  const isEmpty = !loading && results !== null &&
    results.pages.length === 0 &&
    results.parties.length === 0 &&
    results.stock.length === 0 &&
    query.trim() !== ""

  const showQuickNav = query.trim() === ""

  // Compute per-section selected index offsets
  const pageCount = results?.pages.length ?? 0
  const partyCount = results?.parties.length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-xl rounded-2xl shadow-2xl",
          "bg-white/95 backdrop-blur-xl",
          "border border-black/[0.08]",
          "flex flex-col overflow-hidden",
          "max-h-[70vh]"
        )}
        role="dialog"
        aria-label="Spotlight search"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-4 py-3">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground/60" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground/60" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything... (Ctrl+/)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden shrink-0 rounded border border-black/[0.08] bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain py-2">
          {showQuickNav && (
            <QuickNavSection
              items={QUICK_NAV}
              selectedIndex={selectedIndex}
              onSelect={(href) => navigate(href)}
            />
          )}

          {!showQuickNav && isEmpty && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="size-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground/60">
                Try searching for a party name, yarn type, or page name
              </p>
            </div>
          )}

          {!showQuickNav && !isEmpty && results && (
            <>
              {results.pages.length > 0 && (
                <ResultSection title="Pages">
                  {results.pages.map((page, i) => {
                    const Icon = getPageIcon(page.href)
                    const idx = i
                    return (
                      <ResultItem
                        key={page.href}
                        dataIdx={idx}
                        selected={selectedIndex === idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => navigate(page.href)}
                        icon={<Icon className="size-4 text-muted-foreground" />}
                        label={page.label}
                        subtitle={page.description}
                        rightElement={<ArrowRight className="size-3 text-muted-foreground/40" />}
                      />
                    )
                  })}
                </ResultSection>
              )}

              {results.parties.length > 0 && (
                <ResultSection title="Parties">
                  {results.parties.map((party, i) => {
                    const idx = pageCount + i
                    return (
                      <ResultItem
                        key={party.id}
                        dataIdx={idx}
                        selected={selectedIndex === idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => navigate(`/master/parties`)}
                        icon={<Users className="size-4 text-blue-500/70" />}
                        label={party.partyName}
                        subtitle={party.partyType}
                        rightElement={
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            {party.partyType}
                          </span>
                        }
                      />
                    )
                  })}
                </ResultSection>
              )}

              {results.stock.length > 0 && (
                <ResultSection title="Yarn Stock">
                  {results.stock.map((item, i) => {
                    const idx = pageCount + partyCount + i
                    return (
                      <ResultItem
                        key={item.id}
                        dataIdx={idx}
                        selected={selectedIndex === idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => navigate(`/yarn/stock`)}
                        icon={<Box className="size-4 text-amber-500/70" />}
                        label={`${item.counts} — ${item.yarnType}`}
                        subtitle={`Lot: ${item.lotNo}${item.color ? ` · ${item.color}` : ""}`}
                        rightElement={
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {item.stockKgs.toFixed(1)} Kgs
                          </span>
                        }
                      />
                    )
                  })}
                </ResultSection>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex shrink-0 items-center justify-between border-t border-black/[0.06] px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-black/[0.08] bg-muted px-1 py-0.5 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-black/[0.08] bg-muted px-1 py-0.5 font-mono">↵</kbd>
              Open
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <Command className="size-3" />
            <span>BonoStyle Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickNavSection({
  items,
  selectedIndex,
  onSelect,
}: {
  items: typeof QUICK_NAV
  selectedIndex: number
  onSelect: (href: string) => void
}) {
  return (
    <div className="px-3 pb-2">
      <p className="px-1 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        Quick Navigation
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              type="button"
              data-idx={i}
              onClick={() => onSelect(item.href)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] transition-all",
                selectedIndex === i
                  ? "border-primary/20 bg-primary/[0.07] text-primary"
                  : "border-black/[0.07] bg-muted/40 text-foreground hover:border-primary/15 hover:bg-primary/[0.04]"
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-3 pb-1">
      <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function ResultItem({
  dataIdx,
  selected,
  onMouseEnter,
  onClick,
  icon,
  label,
  subtitle,
  rightElement,
}: {
  dataIdx: number
  selected: boolean
  onMouseEnter: () => void
  onClick: () => void
  icon: React.ReactNode
  label: string
  subtitle: string
  rightElement?: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-idx={dataIdx}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected ? "bg-primary/[0.07]" : "hover:bg-black/[0.03]"
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-foreground">
          {label}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/70">
          {subtitle}
        </span>
      </span>
      {rightElement && <span className="shrink-0">{rightElement}</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// SpotlightTrigger — button to open (renders in TopBar or anywhere)
// ---------------------------------------------------------------------------

export function SpotlightTrigger() {
  const { setOpen } = useSpotlight()
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-black/[0.08] bg-muted/40 px-3 py-1.5",
        "text-[12px] text-muted-foreground transition-all",
        "hover:border-black/[0.12] hover:bg-muted/60 hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      )}
    >
      <Search className="size-3.5" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden rounded border border-black/[0.08] bg-white px-1 py-0.5 text-[10px] font-mono sm:inline">
        Ctrl+/
      </kbd>
    </button>
  )
}
