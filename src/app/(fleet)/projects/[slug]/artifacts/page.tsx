import { listArtifacts } from '@/lib/fs/artifact-store';

import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

const TYPE_LABELS: Record<string, string> = {
  'competitive-analysis': 'Competitive Analysis',
  'positioning': 'Positioning',
  'icp-profile': 'ICP Profile',
  'channel-strategy': 'Channel Strategy',
  'launch-plan': 'Launch Plan',
  'messaging': 'Messaging',
  'pricing-analysis': 'Pricing Analysis',
  'action-plan': 'Action Plan',
  'network-analysis': 'Network Analysis',
  'brief': 'Brief',
  'memo': 'Memo',
  'report': 'Report',
};

export default async function ProjectArtifactsPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const artifacts = await listArtifacts(slug);

  return (
    <article className="fleet-panel fleet-stack">
      <h2 style={{ margin: 0 }}>Artifacts</h2>
      <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.85rem' }}>
        GTM deliverables generated for {project.title}.
      </p>

      {artifacts.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {artifacts.map((artifact) => (
            <article
              key={artifact.slug}
              style={{
                background: 'var(--fleet-bg)',
                border: '1px solid var(--fleet-border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--fleet-accent)',
                  }}>
                    {TYPE_LABELS[artifact.type] ?? artifact.type}
                  </span>
                  <h3 style={{ margin: '0.15rem 0 0', fontSize: '0.9rem' }}>{artifact.title}</h3>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--fleet-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(artifact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div style={{ fontSize: '0.83rem', lineHeight: 1.6, color: 'var(--fleet-text)' }}>
                {artifact.body.split('\n').slice(0, 8).map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h4 key={i} style={{ fontSize: '0.8rem', margin: '0.4rem 0 0.2rem', color: 'var(--fleet-accent)' }}>{line.slice(3)}</h4>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i} style={{ marginLeft: '0.75rem', fontSize: '0.8rem' }}>{line.slice(2)}</li>;
                  }
                  if (line.trim() === '') return null;
                  return <p key={i} style={{ margin: '0.1rem 0', fontSize: '0.8rem' }}>{line}</p>;
                })}
                {artifact.body.split('\n').length > 8 && (
                  <p style={{ color: 'var(--fleet-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>...</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No artifacts yet.</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
            Chat with the Fleet agent in the Overview tab to generate GTM deliverables.
          </p>
        </div>
      )}
    </article>
  );
}
