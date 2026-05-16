import { Inbox as InboxIcon } from 'lucide-react'

import { CaptureForm } from '@/components/inbox/capture-form'
import { InboxList } from '@/components/inbox/inbox-list'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { listInboxItems } from '@/lib/fs/inbox-store'

export default async function InboxPage() {
  const items = await listInboxItems()

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <header className="space-y-1.5 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Inbox
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Drop links and notes here for later triage and ingestion into Fleet.
        </p>
      </header>

      <Card className="p-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Quick capture
        </p>
        <CaptureForm />
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Queue</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="Nothing captured yet"
            description="Paste links or notes above. They land here until you triage them into a project."
          />
        ) : (
          <InboxList items={items} />
        )}
      </section>
    </div>
  )
}
