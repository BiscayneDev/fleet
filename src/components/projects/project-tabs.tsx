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
      <ul className="fleet-tab-list">
        {projectTabDefinitions.map((tab) => {
          const href = tab.href(slug);
          const active = pathname === href;

          return (
            <li key={tab.label}>
              <Link aria-current={active ? 'page' : undefined} className="fleet-tab-link" href={href}>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
