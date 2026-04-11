'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { fleetNavItems } from '@/lib/fleet/nav';

export function FleetSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fleet-sidebar">
      <div>
        <p className="fleet-eyebrow">Fleet</p>
        <h1>Workspace</h1>
      </div>

      <nav aria-label="Fleet navigation">
        <ul className="fleet-nav-list">
          {fleetNavItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.key}>
                <Link aria-current={active ? 'page' : undefined} className="fleet-nav-link" href={item.href}>
                  <span>{item.label}</span>
                  <span className="fleet-nav-key">/{item.key}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
