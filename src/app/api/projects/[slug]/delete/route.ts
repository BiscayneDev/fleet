import { NextResponse } from 'next/server';
import { rm } from 'node:fs/promises';
import { resolveDataPath } from '@/lib/fs/path-utils';
import * as path from 'node:path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const projectDir = resolveDataPath(path.join('Projects', slug));
    await rm(projectDir, { recursive: true, force: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[projects/delete]', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
