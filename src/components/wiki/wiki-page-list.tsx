export interface WikiPageListItem {
  slug: string;
  title: string;
  type: string;
  summary: string;
}

export function WikiPageList({ pages }: { pages: WikiPageListItem[] }) {
  if (pages.length === 0) {
    return <p style={{ color: 'var(--fleet-text-muted)' }}>No wiki pages linked yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
      {pages.map((page) => (
        <li
          key={page.slug}
          style={{
            background: 'var(--fleet-panel-muted)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>{page.title}</h2>
              <p style={{ color: 'var(--fleet-text-muted)' }}>{page.summary}</p>
            </div>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid var(--fleet-border)',
                borderRadius: '999px',
                color: 'var(--fleet-text)',
                fontSize: '0.875rem',
                padding: '0.35rem 0.7rem',
                textTransform: 'capitalize',
              }}
            >
              {page.type}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
