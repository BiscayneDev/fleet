'use client'

import { Search } from 'lucide-react'

export function FleetHeader({
  onSearchOpen,
}: {
  onSearchOpen?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <button
        type="button"
        onClick={onSearchOpen}
        className="group flex h-8 w-72 items-center gap-2 rounded-md border border-border bg-card/40 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card/70"
      >
        <Search className="size-3.5 opacity-60" />
        <span className="flex-1 text-left">Search Fleet…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </button>
    </header>
  )
}
