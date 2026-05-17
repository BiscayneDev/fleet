import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Target } from 'lucide-react'

import { AddSignupForm } from '@/components/waitlists/add-signup-form'
import { RunMatcherButton } from '@/components/waitlists/run-matcher-button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state/empty-state'
import {
  getWaitlist,
  listMatches,
  listSignups,
} from '@/lib/fs/waitlist-store'

export default async function WaitlistDetailPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  const waitlist = await getWaitlist(product)
  if (!waitlist) {
    notFound()
  }

  const [signups, matches] = await Promise.all([
    listSignups(product),
    listMatches(product),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="space-y-1.5 border-b border-border pb-6">
        <Link
          href="/waitlists"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          All waitlists
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {waitlist.name ?? waitlist.product}
        </h1>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
          <span>/{waitlist.product}</span>
          <span className="opacity-40">·</span>
          <span>
            <span className="text-foreground/80">{signups.length}</span> signup
            {signups.length === 1 ? '' : 's'}
          </span>
          <span className="opacity-40">·</span>
          <span>
            <span className="text-foreground/80">{matches.length}</span> match
            {matches.length === 1 ? '' : 'es'}
          </span>
        </div>
        {waitlist.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {waitlist.description}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Matcher</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Scans new signups against your contacts (network connections +
              vault <code className="rounded bg-muted px-1 font-mono">contacts/*.md</code>).
              Idempotent — safe to run anytime.
            </p>
          </div>
          <RunMatcherButton product={product} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Matches{' '}
          <span className="text-muted-foreground">({matches.length})</span>
        </h2>
        {matches.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No matches yet"
            description="When a signup email matches one of your contacts, it shows up here. Add a signup below to test."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-border">
              {matches.map((m) => (
                <li
                  key={m.signupId}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 size-2 shrink-0 rounded-full bg-[color:var(--success)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      matched{' '}
                      <code className="rounded bg-muted px-1 font-mono text-[11px]">
                        [[{m.contactRef}]]
                      </code>{' '}
                      at{' '}
                      {new Date(m.matchedAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Signups{' '}
          <span className="text-muted-foreground">({signups.length})</span>
        </h2>
        {signups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No signups yet. Add one manually below for testing.
          </p>
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {signups.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-foreground">
                      <span className="font-medium">{s.email}</span>
                      {s.name && (
                        <span className="text-muted-foreground"> · {s.name}</span>
                      )}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.source && (
                        <Badge
                          variant="outline"
                          className="font-normal text-muted-foreground"
                        >
                          {s.source}
                        </Badge>
                      )}
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {s.context && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      {s.context}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Add signup manually
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Useful for testing the matcher before the{' '}
            <code className="rounded bg-muted px-1 font-mono">
              fleet-waitlist-submit
            </code>{' '}
            helper or your tunnel-based intake is live.
          </p>
        </div>
        <Card className="p-5">
          <AddSignupForm product={product} />
        </Card>
      </section>
    </div>
  )
}
