import { notFound } from 'next/navigation';

import { ProjectTabs } from '@/components/projects/project-tabs';
import { getProject } from '@/lib/fs/project-store';

interface ProjectSourcesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectSourcesPage({ params }: ProjectSourcesPageProps) {
  const { slug } = await params;

  try {
    const project = await getProject(slug);
    const sourceItems = project.sourceIds;

    return (
      <section className="fleet-stack">
        <header className="fleet-panel fleet-stack">
          <p className="fleet-eyebrow">Project sources</p>
          <h1>Sources</h1>
          <p className="fleet-muted">Sources linked to {project.title} will appear here as they are ingested.</p>
          <ProjectTabs slug={project.slug} />
        </header>

        <article className="fleet-panel fleet-stack">
          <h2>Linked source records</h2>
          {sourceItems.length > 0 ? (
            <ul className="fleet-simple-list">
              {sourceItems.map((sourceId) => (
                <li key={sourceId} className="fleet-simple-list-item">
                  <h3 className="fleet-heading-reset">{sourceId}</h3>
                  <p className="fleet-muted">Source ingestion detail will be attached in a later task.</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="fleet-muted">No sources linked yet.</p>
          )}
        </article>
      </section>
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      notFound();
    }

    throw error;
  }
}
