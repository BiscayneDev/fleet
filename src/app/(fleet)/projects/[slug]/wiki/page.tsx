import { WikiPageList, type WikiPageListItem } from '@/components/wiki/wiki-page-list';

import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

function buildWikiPages(project: Awaited<ReturnType<typeof getProjectOrNotFound>>): WikiPageListItem[] {
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

export default async function ProjectWikiPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const pages = buildWikiPages(project);

  return (
    <article className="fleet-panel fleet-stack">
      <h2>Linked pages</h2>
      <p style={{ color: 'var(--fleet-text-muted)' }}>Derived knowledge surfaces for {project.title}.</p>
      <WikiPageList pages={pages} />
    </article>
  );
}
