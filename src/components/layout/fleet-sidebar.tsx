'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { fleetNavItems } from '@/lib/fleet/nav';

const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  projects: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  inbox: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  network: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  wiki: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

interface KBPage {
  slug: string;
  title: string;
  type: string;
}

function useProjectSlug(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

export function FleetSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const projectSlug = useProjectSlug(pathname);
  const [kbPages, setKbPages] = useState<KBPage[]>([]);
  const [kbExpanded, setKbExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  const loadKBPages = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/wiki/${slug}/list`);
      if (res.ok) {
        const data = await res.json();
        setKbPages(data.pages ?? []);
      }
    } catch {
      setKbPages([]);
    }
  }, []);

  useEffect(() => {
    if (projectSlug) {
      loadKBPages(projectSlug);
    } else {
      setKbPages([]);
    }
  }, [projectSlug, loadKBPages]);

  async function handleCreatePage() {
    if (!newPageTitle.trim() || !projectSlug) return;

    const title = newPageTitle.trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const res = await fetch(`/api/wiki/${projectSlug}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `# ${title}\n\n` }),
      });

      if (!res.ok) {
        // Page doesn't exist yet — create it via the ingest endpoint
        await fetch('/api/ingest/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectSlug,
            type: 'note',
            title,
            body: `# ${title}\n\n`,
          }),
        });
      }

      setNewPageTitle('');
      setCreating(false);
      await loadKBPages(projectSlug);
      router.push(`/projects/${projectSlug}/wiki/${slug}`);
    } catch {
      // Silently handle errors
    }
  }

  function handleNewPageKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreatePage();
    } else if (e.key === 'Escape') {
      setCreating(false);
      setNewPageTitle('');
    }
  }

  return (
    <>
      <button
        className="fleet-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="fleet-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fleet-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="fleet-logo">
          <Link href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="fleet-logo-mark">Fleet</span>
            <span className="fleet-logo-tag">GTM</span>
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
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="fleet-nav-icon">{NAV_ICONS[item.key]}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Knowledge Base tree — Cabinet-style */}
        {projectSlug && (
          <div className="sidebar-kb">
            <button
              type="button"
              className="sidebar-kb-toggle"
              onClick={() => setKbExpanded(!kbExpanded)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: kbExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>Knowledge Base</span>
            </button>

            {kbExpanded && (
              <div className="sidebar-kb-tree">
                {kbPages.map((page) => {
                  const pageHref = `/projects/${projectSlug}/wiki/${page.slug}`;
                  const isActive = pathname === pageHref;
                  return (
                    <Link
                      key={page.slug}
                      href={pageHref}
                      className={`sidebar-kb-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>{page.title}</span>
                    </Link>
                  );
                })}

                {/* + New Page */}
                {creating ? (
                  <div className="sidebar-kb-new">
                    <input
                      className="sidebar-kb-new-input"
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      onKeyDown={handleNewPageKeyDown}
                      onBlur={() => { if (!newPageTitle.trim()) { setCreating(false); } }}
                      placeholder="Page title..."
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sidebar-kb-add"
                    onClick={() => setCreating(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>New Page</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
