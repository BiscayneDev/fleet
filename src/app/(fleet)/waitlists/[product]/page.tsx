import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddSignupForm } from '@/components/waitlists/add-signup-form';
import { RunMatcherButton } from '@/components/waitlists/run-matcher-button';
import {
  getWaitlist,
  listMatches,
  listSignups,
} from '@/lib/fs/waitlist-store';

export default async function WaitlistDetailPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  const waitlist = await getWaitlist(product);
  if (!waitlist) {
    notFound();
  }

  const [signups, matches] = await Promise.all([
    listSignups(product),
    listMatches(product),
  ]);

  return (
    <div className="fleet-stack">
      <header className="project-header">
        <Link
          href="/waitlists"
          className="fleet-caption"
          style={{ textDecoration: 'none' }}
        >
          ← All waitlists
        </Link>
        <h1 className="project-header-title">
          {waitlist.name ?? waitlist.product}
        </h1>
        <p className="project-header-summary">
          <code>/{waitlist.product}</code> · {signups.length} signup
          {signups.length === 1 ? '' : 's'} · {matches.length} match
          {matches.length === 1 ? '' : 'es'}
        </p>
        {waitlist.description && (
          <p className="project-header-summary">{waitlist.description}</p>
        )}
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
          <h2 className="fleet-heading-sm">Matcher</h2>
          <RunMatcherButton product={product} />
        </div>
        <p className="fleet-caption">
          Scans new signups against your contacts (network connections + vault{' '}
          <code>contacts/*.md</code>) and writes match records. Idempotent —
          safe to run anytime.
        </p>
      </section>

      <section className="fleet-panel fleet-stack">
        <h2 className="fleet-heading-sm">
          Matches ({matches.length})
        </h2>
        {matches.length === 0 ? (
          <p className="fleet-caption">
            No matches yet. Add signups below and run the matcher to see hits.
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
            {matches.map((m) => (
              <li
                key={m.signupId}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: '0.5rem',
                }}
              >
                <strong>🎯 {m.email}</strong>
                <div className="fleet-caption">
                  matched <code>[[{m.contactRef}]]</code> at{' '}
                  {new Date(m.matchedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="fleet-panel fleet-stack">
        <h2 className="fleet-heading-sm">
          Signups ({signups.length})
        </h2>
        {signups.length === 0 ? (
          <p className="fleet-caption">
            No signups yet. Add one manually below for testing.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {signups.map((s) => (
              <li
                key={s.id}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{s.email}</strong>
                {s.name && <span className="fleet-caption"> · {s.name}</span>}
                <span className="fleet-caption">
                  {' '}· {new Date(s.createdAt).toLocaleString()}
                </span>
                {s.source && (
                  <span className="fleet-caption"> · {s.source}</span>
                )}
                {s.context && (
                  <div
                    className="fleet-caption"
                    style={{ marginTop: '0.25rem', fontStyle: 'italic' }}
                  >
                    {s.context}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="fleet-panel fleet-stack">
        <h2 className="fleet-heading-sm">Add signup manually</h2>
        <p className="fleet-caption">
          Useful for testing the matcher before the{' '}
          <code>@fleet/submit</code> helper ships.
        </p>
        <AddSignupForm product={product} />
      </section>
    </div>
  );
}
