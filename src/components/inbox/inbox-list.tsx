import { ExternalLink, Hash, Lightbulb, FileText } from 'lucide-react'

import type { InboxEntry } from '@/lib/fs/inbox-store'
import { Badge } from '@/components/ui/badge'

function iconFor(kind: string | null) {
  if (kind === 'link') return ExternalLink
  if (kind === 'idea') return Lightbulb
  if (kind) return Hash
  return FileText
}

function formatRelative(capturedAt: string): string {
  const d = new Date(capturedAt)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function InboxList({ items }: { items: InboxEntry[] }) {
  if (items.length === 0) return null

  return (
    <ol className="divide-y divide-border rounded-lg border border-border bg-card/40">
      {items.map((entry) => {
        const Icon = iconFor(entry.kind)
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
          >
            <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {entry.title}
                </span>
                {entry.kind && (
                  <Badge
                    variant="outline"
                    className="font-normal text-muted-foreground"
                  >
                    {entry.kind}
                  </Badge>
                )}
              </div>
              {entry.body !== entry.title && (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {entry.body}
                </p>
              )}
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatRelative(entry.capturedAt)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
