import { getProject } from '@/lib/fs/project-store';
import { runAutoresearch } from '@/lib/autoresearch/orchestrator';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectSlug } = body;

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  try {
    await getProject(projectSlug);
  } catch {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const result = await runAutoresearch(projectSlug);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Autoresearch failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
