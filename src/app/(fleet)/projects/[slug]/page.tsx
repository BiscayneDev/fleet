import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { CaptureForm } from '@/components/inbox/capture-form';
import { ChatPanel } from '@/components/chat/chat-panel';
import { BuildGtmButton } from '@/components/gtm/build-gtm-button';
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

export default async function ProjectWarRoom({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const [wikiPages, artifacts] = await Promise.all([
    listWikiPages(slug),
    listArtifacts(slug),
  ]);

  return (
    <div className="war-room">
      {/* Left: Chat agent */}
      <div className="war-room-chat">
        <ChatPanel
          projectSlug={slug}
          projectTitle={project.title}
          wikiPageCount={wikiPages.length}
        />
      </div>

      {/* Right: Context sidebar */}
      <aside className="war-room-context">
        {/* Quick capture */}
        <div className="war-room-section">
          <CaptureForm preselectedProject={slug} />
        </div>

        {/* Stats */}
        <div className="war-room-stats">
          <Stat label="Status" value={project.status} accent={project.status === 'active' ? '#22c55e' : undefined} />
          <Stat label="Sources" value={String(wikiPages.length)} />
          <Stat label="Artifacts" value={String(artifacts.length)} />
        </div>

        {/* Build GTM */}
        <BuildGtmButton projectSlug={slug} hasArtifacts={artifacts.length > 0} />

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="war-room-section">
            <h3 className="war-room-section-title">Artifacts</h3>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {artifacts.map((a) => (
                <div key={a.slug} className="war-room-item">
                  <span className="war-room-item-badge">{TYPE_LABELS[a.type] ?? a.type}</span>
                  <span className="war-room-item-title">{a.title}</span>
                  <span className="war-room-item-date">{formatDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Captured sources */}
        {wikiPages.length > 0 && (
          <div className="war-room-section">
            <h3 className="war-room-section-title">Captured Sources ({wikiPages.length})</h3>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {wikiPages.slice(0, 10).map((page) => (
                <a
                  key={page.slug}
                  href={page.sourceUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="war-room-source"
                >
                  <strong style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>{page.title}</strong>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fleet-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {page.summary}
                  </p>
                  {page.sourceUrl && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--fleet-accent)' }}>
                      {(() => { try { return new URL(page.sourceUrl).hostname; } catch { return page.sourceUrl; } })()}
                    </span>
                  )}
                </a>
              ))}
              {wikiPages.length > 10 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--fleet-text-muted)', margin: '0.25rem 0 0' }}>
                  +{wikiPages.length - 10} more sources
                </p>
              )}
            </div>
          </div>
        )}

        {/* Goals */}
        {project.goals.length > 0 && (
          <div className="war-room-section">
            <h3 className="war-room-section-title">Goals</h3>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', display: 'grid', gap: '0.25rem' }}>
              {project.goals.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        )}

        {/* Outcomes */}
        {project.desiredOutcomes.length > 0 && (
          <div className="war-room-section">
            <h3 className="war-room-section-title">Desired Outcomes</h3>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', display: 'grid', gap: '0.25rem' }}>
              {project.desiredOutcomes.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="war-room-stat">
      <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '0.1rem 0 0', fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem', color: accent }}>{value}</p>
    </div>
  );
}
