'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const projectTabDefinitions = [
  { label: 'Overview', href: (slug: string) => `/projects/${slug}` },
  { label: 'GTM Builder', href: (slug: string) => `/projects/${slug}/gtm` },
  { label: 'Timeline', href: (slug: string) => `/projects/${slug}/gtm/timeline` },
  { label: 'Sources', href: (slug: string) => `/projects/${slug}/sources` },
  { label: 'Wiki', href: (slug: string) => `/projects/${slug}/wiki` },
  { label: 'Artifacts', href: (slug: string) => `/projects/${slug}/artifacts` },
];

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Project sections">
      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {projectTabDefinitions.map((tab) => {
          const href = tab.href(slug);
          const active = pathname === href;
          const isGtm = tab.label === 'GTM Builder';

          return (
            <li key={tab.label}>
              <Link
                aria-current={active ? 'page' : undefined}
                href={href}
                style={{
                  background: active
                    ? isGtm ? 'rgba(56, 189, 248, 0.15)' : 'var(--fleet-panel-muted)'
                    : 'transparent',
                  border: `1px solid ${active ? isGtm ? 'var(--fleet-accent)' : 'var(--fleet-border)' : 'transparent'}`,
                  borderRadius: '0.4rem',
                  color: active ? isGtm ? 'var(--fleet-accent)' : 'var(--fleet-text)' : 'var(--fleet-text-muted)',
                  display: 'inline-flex',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
