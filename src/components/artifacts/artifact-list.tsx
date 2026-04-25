export interface ArtifactListItem {
  id: string;
  title: string;
  type: string;
  detail: string;
}

export function ArtifactList({ artifacts }: { artifacts: ArtifactListItem[] }) {
  if (artifacts.length === 0) {
    return <p style={{ color: 'var(--fleet-text-muted)' }}>No artifacts attached yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
      {artifacts.map((artifact) => (
        <li
          key={artifact.id}
          style={{
            alignItems: 'flex-start',
            background: 'var(--fleet-panel-muted)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.75rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
            padding: '1rem',
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{artifact.title}</h2>
            <p style={{ color: 'var(--fleet-text-muted)' }}>{artifact.detail}</p>
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
            {artifact.type}
          </span>
        </li>
      ))}
    </ul>
  );
}
