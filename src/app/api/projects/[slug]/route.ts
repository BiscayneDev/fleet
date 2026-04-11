import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { projectUpdateSchema } from '../../../../lib/fleet/schemas';
import { getProject, updateProject } from '../../../../lib/fs/project-store';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { slug } = await context.params;
    const project = await getProject(slug);

    return NextResponse.json({ project });
  } catch (error) {
    if (isMissingFileError(error)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { slug } = await context.params;
    const payload = projectUpdateSchema.parse(await request.json());
    const project = await updateProject(slug, payload);

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid project payload',
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (isMissingFileError(error)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
