import type { InboxItem } from '@/lib/fs/inbox-store';

export function InboxList({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return <p className="fleet-eyebrow">Nothing captured yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: '1rem 0 0', padding: 0 }}>
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            background: 'var(--fleet-panel-muted)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
            <strong>{item.title}</strong>
            <span className="fleet-eyebrow">{item.type}</span>
          </div>
          <p style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>{item.body}</p>
          <div
            style={{
              alignItems: 'center',
              color: 'var(--fleet-text-muted)',
              display: 'flex',
              fontSize: '0.875rem',
              gap: '0.75rem',
              justifyContent: 'space-between',
            }}
          >
            <span>{new Date(item.createdAt).toLocaleString()}</span>
            <span>{item.ingestionStatus}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
