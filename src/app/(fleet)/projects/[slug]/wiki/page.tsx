import { notFound } from 'next/navigation';

import { ProjectTabs } from '@/components/projects/project-tabs';
import { WikiPageList, type WikiPageListItem } from '@/components/wiki/wiki-page-list';
import { getProject } from '@/lib/fs/project-store';

interface ProjectWikiPageProps {
  params: Promise<{ slug: string }>;
}

function buildWikiPages(project: Awaited<ReturnType<typeof getProject>>): WikiPageListItem[] {
  return [
    ...project.participants.map((participant) => ({
      slug: `person-${participant}`,
      title: participant,
      type: 'person',
      summary: 'Project participant tracked from the brief.',
    })),
    ...project.nextActions.map((action, index) => ({
      slug: `decision-${index}`,
      title: `Next action ${index + 1}`,
      type: 'decision',
      summary: action,
    })),
  ];
}

export default async function ProjectWikiPage({ params }: ProjectWikiPageProps) {
  const { slug } = await params;

  try {
    const project = await getProject(slug);
    const pages = buildWikiPages(project);

    return (
      <section className="fleet-stack">
        <header className="fleet-panel fleet-stack">
          <p className="fleet-eyebrow">Project knowledge</p>
          <h1>Wiki</h1>
          <p className="fleet-muted">Derived knowledge surfaces for {project.title}.</p>
          <ProjectTabs slug={project.slug} />
        </header>

        <article className="fleet-panel fleet-stack">
          <h2>Linked pages</h2>
          <WikiPageList pages={pages} />
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
