import { NextResponse } from 'next/server';

import { updateArtifactBody } from '@/lib/fs/artifact-store';

interface RouteParams {
  params: Promise<{ projectSlug: string; artifactSlug: string }>;
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { projectSlug, artifactSlug } = await params;
    const { body } = await request.json();

    if (typeof body !== 'string') {
      return NextResponse.json({ error: 'body must be a string' }, { status: 400 });
    }

    const updated = await updateArtifactBody(projectSlug, artifactSlug, body);

    if (!updated) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ artifact: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update artifact';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
