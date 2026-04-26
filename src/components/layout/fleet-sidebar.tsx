'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { fleetNavItems } from '@/lib/fleet/nav';

export function FleetSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fleet-sidebar">
      <div style={{ padding: '0.25rem 0.75rem 0' }}>
        <Link href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--fleet-accent)',
          }}>
            Fleet
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--fleet-text-muted)',
            marginLeft: '0.4rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            GTM
          </span>
        </Link>
      </div>

      <nav aria-label="Fleet navigation">
        <ul className="fleet-nav-list">
          {fleetNavItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.key}>
                <Link
                  aria-current={active ? 'page' : undefined}
                  className="fleet-nav-link"
                  href={item.href}
                >
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
