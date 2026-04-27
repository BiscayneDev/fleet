import Link from 'next/link';

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
      <h2 className="fleet-heading">Artifacts</h2>
      <p className="fleet-caption">
        GTM deliverables generated for {project.title}.
      </p>

      {artifacts.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {artifacts.map((artifact) => (
            <Link
              key={artifact.slug}
              href={`/projects/${slug}/artifacts/${artifact.slug}`}
              className="fleet-panel-interactive"
              style={{
                display: 'grid',
                gap: '0.4rem',
                background: 'var(--fleet-bg)',
                border: '1px solid var(--fleet-border)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="fleet-badge fleet-badge-complete">
                    {TYPE_LABELS[artifact.type] ?? artifact.type}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{artifact.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="fleet-caption">
                    {new Date(artifact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
              <p className="fleet-body" style={{ margin: 0, color: 'var(--fleet-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {artifact.body.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fleet-text-muted)' }}>No artifacts yet.</p>
          <p className="fleet-caption" style={{ margin: '0.25rem 0 0' }}>
            Chat with the Fleet agent in the Overview tab to generate GTM deliverables.
          </p>
        </div>
      )}
    </article>
  );
}
