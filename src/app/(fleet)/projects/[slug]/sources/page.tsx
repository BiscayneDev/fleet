import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function ProjectSourcesPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const sourceItems = project.sourceIds;

  return (
    <article className="fleet-panel fleet-stack">
      <h2>Linked source records</h2>
      <p style={{ color: 'var(--fleet-text-muted)' }}>
        Sources linked to {project.title} will appear here as they are ingested.
      </p>
      {sourceItems.length > 0 ? (
        <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
          {sourceItems.map((sourceId) => (
            <li
              key={sourceId}
              style={{
                background: 'var(--fleet-panel-muted)',
                border: '1px solid var(--fleet-border)',
                borderRadius: '0.75rem',
                padding: '1rem',
              }}
            >
              <h3 style={{ margin: 0 }}>{sourceId}</h3>
              <p style={{ color: 'var(--fleet-text-muted)' }}>
                Source ingestion detail will be attached in a later task.
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: 'var(--fleet-text-muted)' }}>No sources linked yet.</p>
      )}
    </article>
  );
}
