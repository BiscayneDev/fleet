'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const projectTabDefinitions = [
  { label: 'Overview', href: (slug: string) => `/projects/${slug}` },
  { label: 'Sources', href: (slug: string) => `/projects/${slug}/sources` },
  { label: 'Wiki', href: (slug: string) => `/projects/${slug}/wiki` },
  { label: 'Artifacts', href: (slug: string) => `/projects/${slug}/artifacts` },
  { label: 'Sessions', href: (slug: string) => `/projects/${slug}/sessions` },
];

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Project sections">
      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {projectTabDefinitions.map((tab) => {
          const href = tab.href(slug);
          const active = pathname === href;

          return (
            <li key={tab.label}>
              <Link
                aria-current={active ? 'page' : undefined}
                href={href}
                style={{
                  background: 'var(--fleet-panel-muted)',
                  border: `1px solid ${active ? 'var(--fleet-accent)' : 'transparent'}`,
                  borderRadius: '999px',
                  color: active ? 'white' : undefined,
                  display: 'inline-flex',
                  padding: '0.6rem 0.9rem',
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
