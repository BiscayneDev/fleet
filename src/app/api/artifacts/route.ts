import { writeArtifact } from '@/lib/fs/artifact-store';
import type { ArtifactType } from '@/lib/fleet/types';
import { artifactTypes } from '@/lib/fleet/types';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectSlug, title, type, content } = body;

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  if (!title || typeof title !== 'string') {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

  if (!type || !artifactTypes.includes(type as ArtifactType)) {
    return Response.json({ error: 'Invalid artifact type' }, { status: 400 });
  }

  if (!content || typeof content !== 'string') {
    return Response.json({ error: 'content is required' }, { status: 400 });
  }

  try {
    const artifact = await writeArtifact(projectSlug, {
      title,
      type: type as ArtifactType,
      body: content,
    });
    return Response.json({ artifact });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save artifact';
    return Response.json({ error: message }, { status: 500 });
  }
}
