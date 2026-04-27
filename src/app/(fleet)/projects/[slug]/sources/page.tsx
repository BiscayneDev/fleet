import Link from 'next/link';

import { listWikiPages } from '@/lib/fs/wiki-store';
import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function ProjectSourcesPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const wikiPages = await listWikiPages(slug);

  return (
    <article className="fleet-panel fleet-stack">
      <h2 className="fleet-heading">Linked Sources</h2>
      <p className="fleet-caption">
        Research captured and enriched for {project.title}.
      </p>
      {wikiPages.length > 0 ? (
        <div className="fleet-stack" style={{ gap: '0.35rem' }}>
          {wikiPages.map((page) => (
            <Link
              key={page.slug}
              href={`/projects/${slug}/wiki/${page.slug}`}
              className="kb-page-item"
            >
              <span className="kb-page-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <span className="kb-page-title">{page.title}</span>
              <span className="fleet-badge fleet-badge-active" style={{ fontSize: '0.6rem' }}>{page.type}</span>
              {page.sourceUrl && (
                <span className="fleet-caption" style={{ flexShrink: 0 }}>
                  {(() => { try { return new URL(page.sourceUrl).hostname; } catch { return ''; } })()}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="fleet-caption">No sources linked yet. Paste a URL in the war room to capture research.</p>
      )}
    </article>
  );
}
