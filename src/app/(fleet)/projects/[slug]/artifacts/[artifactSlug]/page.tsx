import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getArtifact, listArtifacts } from '@/lib/fs/artifact-store';
import { ArtifactEditor } from '@/components/artifacts/artifact-editor';

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

interface ArtifactRouteProps {
  params: Promise<{ slug: string; artifactSlug: string }>;
}

export default async function ArtifactDetail({ params }: ArtifactRouteProps) {
  const { slug, artifactSlug } = await params;
  const [artifact, allArtifacts] = await Promise.all([
    getArtifact(slug, artifactSlug),
    listArtifacts(slug),
  ]);

  if (!artifact) {
    notFound();
  }

  const typeLabel = TYPE_LABELS[artifact.type] ?? artifact.type;

  return (
    <div className="doc-layout">
      {/* Artifact tree sidebar */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-header">
          <Link href={`/projects/${slug}/artifacts`} className="doc-sidebar-back">
            ← Artifacts
          </Link>
        </div>
        <nav className="doc-sidebar-tree">
          <p className="doc-sidebar-section">Artifacts</p>
          {allArtifacts.map((a) => (
            <Link
              key={a.slug}
              href={`/projects/${slug}/artifacts/${a.slug}`}
              className={`doc-sidebar-item ${a.slug === artifactSlug ? 'active' : ''}`}
            >
              <span className="doc-sidebar-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
              <span className="doc-sidebar-label">{a.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Document editor */}
      <main className="doc-main">
        <div className="doc-header">
          <span className="doc-breadcrumb">{artifact.title}</span>
          <div className="doc-header-meta">
            <span className="fleet-badge fleet-badge-complete">{typeLabel}</span>
            <span className="fleet-caption">
              {new Date(artifact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        <ArtifactEditor
          projectSlug={slug}
          artifactSlug={artifactSlug}
          initialContent={artifact.body}
        />
      </main>
    </div>
  );
}
