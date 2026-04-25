import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { createInboxItem } from '@/lib/fs/inbox-store';
import { writeWikiPage } from '@/lib/fs/wiki-store';
import { getLlmWikiClient } from '@/lib/llm-wiki/client';

const ingestLinkRequestSchema = z
  .object({
    url: z.url({ protocol: /^https?$/ }),
    projectSlug: z.string().min(1).optional(),
  })
  .strict();

export async function ingestLink(input: { url: string; projectSlug?: string }) {
  const payload = ingestLinkRequestSchema.parse(input);
  const item = await createInboxItem({ content: payload.url });
  const llmWiki = getLlmWikiClient();

  await llmWiki.init();

  const processed = await llmWiki.ingest({ source: item });

  // If a project slug is provided, persist the wiki pages
  const savedPages = [];
  if (input.projectSlug) {
    for (const page of processed.pages) {
      const saved = await writeWikiPage(input.projectSlug, {
        slug: page.id,
        title: page.title,
        type: page.type === 'source' ? 'source' : 'concept',
        summary: page.summary,
        body: page.summary,
        sourceUrl: item.body,
      });
      savedPages.push(saved);
    }
  }

  return {
    item,
    processed,
    pages: savedPages,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log('[ingest] POST received');
  try {
    const payload = ingestLinkRequestSchema.parse(await request.json());
    console.log('[ingest] Payload parsed:', payload);
    const result = await ingestLink(payload);
    console.log('[ingest] Success:', result.item.id);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[ingest] Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Malformed JSON body',
        },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid link ingest payload',
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    throw error;
  }
}
