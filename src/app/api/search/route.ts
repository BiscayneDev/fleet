import { listProjects } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { listConnections } from '@/lib/fs/network-store';

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: string;
  snippet?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').toLowerCase().trim();

  if (!q) {
    return Response.json({ results: [] });
  }

  const projects = await listProjects();
  const hits: SearchHit[] = [];

  // Search projects
  for (const p of projects) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q)
    ) {
      hits.push({
        id: `project-${p.slug}`,
        title: p.title,
        subtitle: p.status,
        href: `/projects/${p.slug}`,
        group: 'Projects',
      });
    }
  }

  // Search wiki pages (full-text across all projects)
  for (const project of projects) {
    const pages = await listWikiPages(project.slug);
    for (const page of pages) {
      if (
        page.title.toLowerCase().includes(q) ||
        page.summary.toLowerCase().includes(q) ||
        page.body.toLowerCase().includes(q)
      ) {
        const snippet = extractSnippet(page.body, q);
        hits.push({
          id: `wiki-${project.slug}-${page.slug}`,
          title: page.title,
          subtitle: project.title,
          href: `/projects/${project.slug}/wiki/${page.slug}`,
          group: 'Knowledge Base',
          snippet,
        });
      }
    }
  }

  // Search artifacts (full-text across all projects)
  for (const project of projects) {
    const artifacts = await listArtifacts(project.slug);
    for (const artifact of artifacts) {
      if (
        artifact.title.toLowerCase().includes(q) ||
        artifact.body.toLowerCase().includes(q)
      ) {
        const snippet = extractSnippet(artifact.body, q);
        hits.push({
          id: `artifact-${project.slug}-${artifact.slug}`,
          title: artifact.title,
          subtitle: project.title,
          href: `/projects/${project.slug}/artifacts/${artifact.slug}`,
          group: 'Artifacts',
          snippet,
        });
      }
    }
  }

  // Search connections
  const connections = await listConnections({});
  for (const c of connections.slice(0, 100)) {
    const name = c.displayName;
    if (
      name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.position ?? '').toLowerCase().includes(q)
    ) {
      hits.push({
        id: `connection-${c.handle}`,
        title: name,
        subtitle: [c.position, c.company].filter(Boolean).join(' at '),
        href: '/network',
        group: 'Network',
      });
    }
  }

  return Response.json({ results: hits.slice(0, 20) });
}

function extractSnippet(body: string, query: string): string | undefined {
  const lower = body.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return undefined;

  const start = Math.max(0, idx - 40);
  const end = Math.min(body.length, idx + query.length + 60);
  let snippet = body.slice(start, end).replace(/\n/g, ' ').trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < body.length) snippet = snippet + '...';

  return snippet;
}
