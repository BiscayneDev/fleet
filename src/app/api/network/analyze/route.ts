import { getProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listConnections } from '@/lib/fs/network-store';
import { writeArtifact } from '@/lib/fs/artifact-store';
import { analyzeNetworkForProject } from '@/lib/network/network-analyzer';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectSlug } = body;

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  let project;
  try {
    project = await getProject(projectSlug);
  } catch {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const [connections, wikiPages] = await Promise.all([
    listConnections(),
    listWikiPages(projectSlug),
  ]);

  if (connections.length === 0) {
    return Response.json({ error: 'No connections imported yet. Import your network first.' }, { status: 400 });
  }

  try {
    const analysis = await analyzeNetworkForProject(connections, project, wikiPages);

    const artifact = await writeArtifact(projectSlug, {
      title: `Network Analysis — ${project.title}`,
      type: 'network-analysis',
      body: analysis,
    });

    return Response.json({ artifact, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
