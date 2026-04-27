import { NextResponse } from 'next/server';

import { updateWikiPageBody, getWikiPage, writeWikiPage, deleteWikiPage } from '@/lib/fs/wiki-store';

interface RouteParams {
  params: Promise<{ projectSlug: string; pageSlug: string }>;
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { projectSlug, pageSlug } = await params;
    const { body, title } = await request.json();

    if (typeof body !== 'string') {
      return NextResponse.json({ error: 'body must be a string' }, { status: 400 });
    }

    // Try to update existing page first
    const existing = await getWikiPage(projectSlug, pageSlug);

    if (existing) {
      const updated = await updateWikiPageBody(projectSlug, pageSlug, body);
      return NextResponse.json({ page: updated });
    }

    // Create new page if it doesn't exist
    const pageTitle = typeof title === 'string' ? title : pageSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const created = await writeWikiPage(projectSlug, {
      slug: pageSlug,
      title: pageTitle,
      type: 'concept',
      summary: '',
      body,
    });

    return NextResponse.json({ page: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save wiki page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { projectSlug, pageSlug } = await params;
    const deleted = await deleteWikiPage(projectSlug, pageSlug);

    if (!deleted) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete wiki page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
