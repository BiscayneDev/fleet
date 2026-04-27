import { listWikiPages } from '@/lib/fs/wiki-store';

interface RouteParams {
  params: Promise<{ projectSlug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { projectSlug } = await params;
  const wikiPages = await listWikiPages(projectSlug);

  const pages = wikiPages.map((p) => ({
    slug: p.slug,
    title: p.title,
    type: p.type,
  }));

  return Response.json({ pages });
}
