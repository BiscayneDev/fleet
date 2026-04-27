import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getWikiPage, listWikiPages } from '@/lib/fs/wiki-store';
import { WikiPageEditor } from '@/components/wiki/wiki-page-editor';
import { WikiPageDelete } from '@/components/wiki/wiki-page-delete';

interface WikiPageRouteProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export default async function WikiPageDetail({ params }: WikiPageRouteProps) {
  const { slug, pageSlug } = await params;
  const [page, allPages] = await Promise.all([
    getWikiPage(slug, pageSlug),
    listWikiPages(slug),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <div className="doc-layout">
      {/* Page tree sidebar */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-header">
          <Link href={`/projects/${slug}/wiki`} className="doc-sidebar-back">
            ← Wiki
          </Link>
        </div>
        <nav className="doc-sidebar-tree">
          <p className="doc-sidebar-section">Pages</p>
          {allPages.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${slug}/wiki/${p.slug}`}
              className={`doc-sidebar-item ${p.slug === pageSlug ? 'active' : ''}`}
            >
              <span className="doc-sidebar-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <span className="doc-sidebar-label">{p.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Document editor */}
      <main className="doc-main">
        <div className="doc-header">
          <span className="doc-breadcrumb">{page.title}</span>
          <div className="doc-header-meta">
            <span className="fleet-badge fleet-badge-active">{page.type}</span>
            {page.sourceUrl && (
              <a href={page.sourceUrl} target="_blank" rel="noopener noreferrer" className="doc-source-link">
                {(() => { try { return new URL(page.sourceUrl).hostname; } catch { return 'source'; } })()}
              </a>
            )}
            <WikiPageDelete projectSlug={slug} pageSlug={pageSlug} />
          </div>
        </div>
        <WikiPageEditor
          projectSlug={slug}
          pageSlug={pageSlug}
          initialContent={page.body}
        />
      </main>
    </div>
  );
}
