import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { createInboxItem } from '@/lib/fs/inbox-store';
import { getLlmWikiClient } from '@/lib/llm-wiki/client';

const ingestLinkRequestSchema = z
  .object({
    url: z.url({ protocol: /^https?$/ }),
  })
  .strict();

export async function ingestLink(input: { url: string }) {
  const payload = ingestLinkRequestSchema.parse(input);
  const item = await createInboxItem({ content: payload.url });
  const llmWiki = getLlmWikiClient();

  await llmWiki.init();

  const processed = await llmWiki.ingest({ source: item });

  return {
    item,
    processed,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = ingestLinkRequestSchema.parse(await request.json());
    const result = await ingestLink(payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
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
