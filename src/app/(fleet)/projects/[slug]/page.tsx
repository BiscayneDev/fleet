import { listWikiPages } from '@/lib/fs/wiki-store';
import { CaptureForm } from '@/components/inbox/capture-form';
import { getProjectOrNotFound, type ProjectRouteProps } from './project-page';

export default async function ProjectWarRoom({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const wikiPages = await listWikiPages(slug);

  // Extract all concepts, competitors, and risks from wiki pages
  const allConcepts = [...new Set(wikiPages.flatMap((p) => p.concepts))];
  const allCompetitors = [...new Set(wikiPages.flatMap((p) => p.competitors))];
  const allRisks = [...new Set(wikiPages.flatMap((p) => p.risks))];
  const allActions = [...new Set(wikiPages.flatMap((p) => p.suggestedActions))];

  const hasEnrichment = allConcepts.length > 0 || allCompetitors.length > 0 || allRisks.length > 0;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Quick capture for this project */}
      <article className="fleet-panel fleet-stack">
        <p className="fleet-eyebrow">Drop a link to research</p>
        <CaptureForm preselectedProject={slug} />
      </article>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Stat label="Status" value={project.status} />
        <Stat label="Wiki pages" value={String(wikiPages.length)} />
        <Stat label="Goals" value={String(project.goals.length)} />
        <Stat label="Sources" value={String(project.sourceIds.length)} />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
        }}
      >
        {/* Left: Context */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Goals & Outcomes */}
          <article className="fleet-panel fleet-stack">
            <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Goals</h2>
            {project.goals.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                {project.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.8rem' }}>
                No goals set yet.
              </p>
            )}
          </article>

          <article className="fleet-panel fleet-stack">
            <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Outcomes</h2>
            {project.desiredOutcomes.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                {project.desiredOutcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.8rem' }}>
                No outcomes defined yet.
              </p>
            )}
          </article>

          {/* Competitors */}
          {allCompetitors.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Competitors</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {allCompetitors.map((c) => (
                  <span
                    key={c}
                    style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: '999px',
                      color: '#eab308',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </article>
          )}
        </div>

        {/* Right: Intelligence */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Risks */}
          {allRisks.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Risks</h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                {allRisks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </article>
          )}

          {/* Suggested Actions */}
          {allActions.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Suggested actions</h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                {allActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </article>
          )}

          {/* Recent Wiki */}
          <article className="fleet-panel fleet-stack">
            <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Recent research</h2>
            {wikiPages.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {wikiPages.slice(0, 5).map((page) => (
                  <div
                    key={page.slug}
                    style={{
                      background: 'var(--fleet-bg)',
                      borderRadius: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{page.title}</strong>
                      <span style={{ color: 'var(--fleet-text-muted)', fontSize: '0.7rem' }}>{page.type}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--fleet-text-muted)' }}>
                      {page.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.8rem' }}>
                No research yet. Paste a link in Quick Capture to start.
              </p>
            )}
          </article>

          {/* Concepts */}
          {allConcepts.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ fontSize: '0.9rem', margin: 0 }}>Key concepts</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {allConcepts.map((c) => (
                  <span
                    key={c}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '999px',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* Empty state */}
      {wikiPages.length === 0 && (
        <article
          className="fleet-panel"
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--fleet-text-muted)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            No intelligence gathered yet.
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
            Go to <a href="/" style={{ color: 'var(--fleet-accent)' }}>Home</a>, paste a link in Quick Capture, and select this project to start researching.
          </p>
        </article>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--fleet-panel-muted)',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        minWidth: '5rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ margin: '0.15rem 0 0', fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem' }}>
        {value}
      </p>
    </div>
  );
}
