import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { projectCreateSchema } from '../../../lib/fleet/schemas';
import { createProject, listProjects } from '../../../lib/fs/project-store';

export async function GET(): Promise<NextResponse> {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = projectCreateSchema.parse(await request.json());
    const project = await createProject(payload);

    return NextResponse.json({ project }, { status: 201 });
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

    throw error;
  }
}
