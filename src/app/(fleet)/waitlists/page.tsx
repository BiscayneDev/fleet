import Link from 'next/link';

import { CreateWaitlistForm } from '@/components/waitlists/create-waitlist-form';
import { RunMatcherButton } from '@/components/waitlists/run-matcher-button';
import {
  listMatches,
  listSignups,
  listWaitlists,
  isVaultMode,
} from '@/lib/fs/waitlist-store';

export default async function WaitlistsPage() {
  const waitlists = await listWaitlists();

  const summaries = await Promise.all(
    waitlists.map(async (w) => {
      const [signups, matches] = await Promise.all([
        listSignups(w.product),
        listMatches(w.product),
      ]);
      return {
        ...w,
        signupCount: signups.length,
        matchCount: matches.length,
      };
    }),
  );

  return (
    <div className="fleet-stack">
      <header className="project-header">
        <h1 className="project-header-title">Waitlists</h1>
        <p className="project-header-summary">
          Sync waitlist signups into your vault and match them against your
          contacts. {isVaultMode() ? (
            <>Vault mode is <strong>on</strong> — reading from{' '}
              <code>$FLEET_VAULT_ROOT/waitlists/</code>.</>
          ) : (
            <>Vault mode is <strong>off</strong> — using{' '}
              <code>./data/waitlists/</code>. Set <code>FLEET_VAULT_ROOT</code>{' '}
              to write into your Obsidian vault.</>
          )}
        </p>
      </header>

      <section className="fleet-panel fleet-stack">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <h2 className="fleet-heading-sm">Your waitlists</h2>
          <RunMatcherButton />
        </div>

        {summaries.length === 0 ? (
          <p className="fleet-caption">
            No waitlists yet. Create one below to start collecting signups.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {summaries.map((w) => (
              <li key={w.product}>
                <Link
                  href={`/waitlists/${encodeURIComponent(w.product)}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.5rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <span>
                    <strong>{w.name ?? w.product}</strong>{' '}
                    <span className="fleet-caption">/{w.product}</span>
                  </span>
                  <span className="fleet-caption">
                    {w.signupCount} signup{w.signupCount === 1 ? '' : 's'} ·{' '}
                    {w.matchCount} match{w.matchCount === 1 ? '' : 'es'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="fleet-panel fleet-stack">
        <h2 className="fleet-heading-sm">Add a waitlist</h2>
        <CreateWaitlistForm />
      </section>
    </div>
  );
}
