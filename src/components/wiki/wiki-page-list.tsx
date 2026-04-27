import Link from 'next/link';

export interface WikiPageListItem {
  slug: string;
  title: string;
  type: string;
  summary: string;
}

export function WikiPageList({ pages, projectSlug }: { pages: WikiPageListItem[]; projectSlug: string }) {
  if (pages.length === 0) {
    return <p style={{ color: 'var(--fleet-text-muted)' }}>No wiki pages linked yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
      {pages.map((page) => (
        <li key={page.slug}>
          <Link
            href={`/projects/${projectSlug}/wiki/${page.slug}`}
            className="fleet-panel fleet-panel-interactive"
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: '0.95rem' }}>{page.title}</h2>
                <p className="fleet-caption" style={{ marginTop: '0.2rem' }}>{page.summary}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span className="fleet-badge fleet-badge-active">{page.type}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
