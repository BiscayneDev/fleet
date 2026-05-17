import Link from 'next/link'
import { Activity, AlertCircle, ArrowRight } from 'lucide-react'

import { CreateWaitlistForm } from '@/components/waitlists/create-waitlist-form'
import { RunMatcherButton } from '@/components/waitlists/run-matcher-button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import {
  listMatches,
  listSignups,
  listWaitlists,
  isVaultMode,
} from '@/lib/fs/waitlist-store'
import { getDefaultVaultContactsDir } from '@/lib/fs/contact-loader'

export default async function WaitlistsPage() {
  const waitlists = await listWaitlists()

  const summaries = await Promise.all(
    waitlists.map(async (w) => {
      const [signups, matches] = await Promise.all([
        listSignups(w.product),
        listMatches(w.product),
      ])
      return {
        ...w,
        signupCount: signups.length,
        matchCount: matches.length,
      }
    }),
  )

  const vaultActive = isVaultMode()

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="space-y-1.5 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Waitlists
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Waitlists
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Sync waitlist signups into your vault and match them against your
          contacts.
        </p>
        {vaultActive && (
          <p className="font-mono text-[11px] text-muted-foreground">
            $FLEET_VAULT_ROOT · contacts dir{' '}
            <span className="text-foreground/80">
              {getDefaultVaultContactsDir()}/
            </span>
          </p>
        )}
      </header>

      {!vaultActive && (
        <Card className="border-primary/25 bg-primary/[0.04] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Vault not configured
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Set <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">FLEET_VAULT_ROOT</code>{' '}
                to write waitlist signups and matches into your Obsidian vault as
                markdown — and to read contacts from{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{`<vault>/contacts/*.md`}</code>{' '}
                when matching.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Without it, Fleet falls back to{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">./data/waitlists/</code>.
                For Karpathy-style vaults that keep contacts in{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">wiki/people/</code>,
                also set{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">FLEET_VAULT_CONTACTS_DIR=wiki/people</code>.
              </p>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Your waitlists
          </h2>
          <RunMatcherButton />
        </div>

        {summaries.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No waitlists yet"
            description="Create one below to start collecting signups. Each waitlist becomes a markdown folder in your vault."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-border">
              {summaries.map((w) => (
                <li key={w.product}>
                  <Link
                    href={`/waitlists/${encodeURIComponent(w.product)}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {w.name ?? w.product}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{w.product}
                      </p>
                    </div>
                    <div className="hidden gap-6 font-mono text-xs tabular-nums text-muted-foreground sm:flex">
                      <span>
                        <span className="text-foreground/80">
                          {w.signupCount}
                        </span>{' '}
                        signup{w.signupCount === 1 ? '' : 's'}
                      </span>
                      <span>
                        <span className="text-foreground/80">
                          {w.matchCount}
                        </span>{' '}
                        match{w.matchCount === 1 ? '' : 'es'}
                      </span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Add a waitlist
        </h2>
        <Card className="p-5">
          <CreateWaitlistForm />
        </Card>
      </section>
    </div>
  )
}
