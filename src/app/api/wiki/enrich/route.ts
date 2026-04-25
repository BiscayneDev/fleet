import { NextResponse } from 'next/server';
import { z } from 'zod';

import { listInboxItems } from '@/lib/fs/inbox-store';
import { writeWikiPage } from '@/lib/fs/wiki-store';
import { getLlmWikiClient } from '@/lib/llm-wiki/client';

const enrichRequestSchema = z
  .object({
    inboxItemId: z.string().min(1),
    projectSlug: z.string().min(1),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { inboxItemId, projectSlug } = enrichRequestSchema.parse(body);

    // Find the inbox item
    const items = await listInboxItems();
    const item = items.find((i) => i.id === inboxItemId);

    if (!item) {
      return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 });
    }

    // Run enrichment
    const llmWiki = getLlmWikiClient();
    await llmWiki.init();
    const result = await llmWiki.ingest({ source: item });

    // Persist wiki pages
    const savedPages = [];
    for (const page of result.pages) {
      const saved = await writeWikiPage(projectSlug, {
        slug: page.id,
        title: page.title,
        type: page.type === 'source' ? 'source' : 'concept',
        summary: page.summary,
        body: page.summary,
        sourceUrl: item.body,
      });
      savedPages.push(saved);
    }

    return NextResponse.json(
      {
        status: 'enriched',
        pages: savedPages,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 },
      );
    }

    console.error('[wiki/enrich]', error);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}
