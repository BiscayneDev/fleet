import Link from 'next/link';

import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { ChatPanel } from '@/components/chat/chat-panel';
import { CompetitiveIntel } from '@/components/competitive/competitive-intel';
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
      {/* Main: Chat + competitive intel */}
      <div className="war-room-chat">
        <div className="war-room-quick-actions">
          <CompetitiveIntel projectSlug={slug} />
        </div>
        <ChatPanel
          projectSlug={slug}
          projectTitle={project.title}
          wikiPageCount={wikiPages.length}
        />
      </div>

      {/* Right: Context sidebar — compact, scrollable */}
      <aside className="war-room-context">
        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="war-room-section">
            <div className="war-room-section-header">
              <h3 className="war-room-section-title">Artifacts</h3>
              <Link href={`/projects/${slug}/artifacts`} className="war-room-view-link">View all</Link>
            </div>
            <div className="war-room-item-list">
              {artifacts.slice(0, 5).map((a) => (
                <Link
                  key={a.slug}
                  href={`/projects/${slug}/artifacts/${a.slug}`}
                  className="war-room-item"
                >
                  <span className="war-room-item-badge">{TYPE_LABELS[a.type] ?? a.type}</span>
                  <span className="war-room-item-title">{a.title}</span>
                  <span className="war-room-item-date">{formatDate(a.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {wikiPages.length > 0 && (
          <div className="war-room-section">
            <div className="war-room-section-header">
              <h3 className="war-room-section-title">Sources ({wikiPages.length})</h3>
              <Link href={`/projects/${slug}/wiki`} className="war-room-view-link">View all</Link>
            </div>
            <div className="war-room-item-list">
              {wikiPages.slice(0, 6).map((page) => (
                <Link
                  key={page.slug}
                  href={`/projects/${slug}/wiki/${page.slug}`}
                  className="war-room-source"
                >
                  <strong style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>{page.title}</strong>
                  {page.sourceUrl && (
                    <span style={{ fontSize: '0.62rem', color: 'var(--fleet-accent)' }}>
                      {(() => { try { return new URL(page.sourceUrl).hostname; } catch { return ''; } })()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {project.goals.length > 0 && (
          <div className="war-room-section">
            <h3 className="war-room-section-title">Goals</h3>
            <ul className="war-room-list">
              {project.goals.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
