export interface SessionListItem {
  id: string;
  title: string;
  detail: string;
}

export function SessionList({ sessions }: { sessions: SessionListItem[] }) {
  if (sessions.length === 0) {
    return <p style={{ color: 'var(--fleet-text-muted)' }}>No session history yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
      {sessions.map((session) => (
        <li
          key={session.id}
          style={{
            background: 'var(--fleet-panel-muted)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
        >
          <h2 style={{ margin: 0 }}>{session.title}</h2>
          <p style={{ color: 'var(--fleet-text-muted)' }}>{session.detail}</p>
        </li>
      ))}
    </ul>
  );
}
