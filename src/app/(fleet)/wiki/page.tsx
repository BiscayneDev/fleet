import Link from 'next/link';

import { listProjects } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';

export default async function GlobalWikiPage() {
  const projects = await listProjects();

  const projectsWithPages = await Promise.all(
    projects.map(async (project) => {
      const pages = await listWikiPages(project.slug);
      return { project, pages };
    }),
  );

  const allWithPages = projectsWithPages.filter((p) => p.pages.length > 0);

  return (
    <section className="fleet-stack">
      <header className="project-header">
        <h1 className="project-header-title">Knowledge Base</h1>
        <p className="project-header-summary">
          All captured research and derived knowledge across your projects.
        </p>
      </header>

      {allWithPages.length === 0 ? (
        <div className="fleet-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ margin: 0, color: 'var(--fleet-text-muted)' }}>
            No wiki pages yet. Capture links and notes in a project to build your knowledge base.
          </p>
        </div>
      ) : (
        <div className="fleet-stack">
          {allWithPages.map(({ project, pages }) => (
            <div key={project.slug} className="fleet-panel fleet-stack">
              <div className="home-section-header">
                <h2 className="fleet-heading-sm">{project.title}</h2>
                <Link href={`/projects/${project.slug}/wiki`} className="home-view-all">
                  View all →
                </Link>
              </div>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {pages.slice(0, 8).map((page) => (
                  <Link
                    key={page.slug}
                    href={`/projects/${project.slug}/wiki/${page.slug}`}
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
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
