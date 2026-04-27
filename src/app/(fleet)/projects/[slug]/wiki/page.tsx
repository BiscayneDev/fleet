import { WikiPageList, type WikiPageListItem } from '@/components/wiki/wiki-page-list';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function ProjectWikiPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const wikiPages = await listWikiPages(slug);

  const pages: WikiPageListItem[] = wikiPages.map((page) => ({
    slug: page.slug,
    title: page.title,
    type: page.type,
    summary: page.summary,
  }));

  return (
    <article className="fleet-panel fleet-stack">
      <h2>Linked pages</h2>
      <p style={{ color: 'var(--fleet-text-muted)' }}>Derived knowledge surfaces for {project.title}.</p>
      <WikiPageList pages={pages} projectSlug={slug} />
    </article>
  );
}
