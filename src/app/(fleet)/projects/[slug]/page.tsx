import { listWikiPages } from '@/lib/fs/wiki-store';
import { CaptureForm } from '@/components/inbox/capture-form';
import { getProjectOrNotFound, type ProjectRouteProps } from './project-page';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ProjectWarRoom({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const wikiPages = await listWikiPages(slug);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Quick capture */}
      <article className="fleet-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="fleet-eyebrow" style={{ marginBottom: '0.25rem' }}>Capture</p>
            <CaptureForm preselectedProject={slug} />
          </div>
        </div>
      </article>

      {/* Status bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Stat label="Status" value={project.status} accent={project.status === 'active' ? '#22c55e' : undefined} />
        <Stat label="Captured" value={String(wikiPages.length)} />
        <Stat label="Goals" value={String(project.goals.length)} />
        <Stat label="Outcomes" value={String(project.desiredOutcomes.length)} />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
        {/* Left: Context */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {project.goals.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'grid', gap: '0.35rem' }}>
                {project.goals.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </article>
          )}

          {project.desiredOutcomes.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcomes</h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'grid', gap: '0.35rem' }}>
                {project.desiredOutcomes.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </article>
          )}

          {project.goals.length === 0 && project.desiredOutcomes.length === 0 && (
            <article className="fleet-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No goals or outcomes set. Edit the project to add them.</p>
            </article>
          )}
        </div>

        {/* Right: Captured links */}
        <article className="fleet-panel fleet-stack">
          <h2 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Captured ({wikiPages.length})
          </h2>
          {wikiPages.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {wikiPages.map((page) => (
                <a
                  key={page.slug}
                  href={page.sourceUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'var(--fleet-bg)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    display: 'grid',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid var(--fleet-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>{page.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--fleet-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(page.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fleet-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {page.summary}
                  </p>
                  {page.sourceUrl && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--fleet-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {new URL(page.sourceUrl).hostname}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No links captured yet.</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>Paste a URL above to save it here.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--fleet-panel-muted)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', minWidth: '5rem' }}>
      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '0.15rem 0 0', fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem', color: accent }}>{value}</p>
    </div>
  );
}
