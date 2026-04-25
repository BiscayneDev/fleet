import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { createInboxItem, listInboxItems } from '@/lib/fs/inbox-store';

const inboxCaptureRequestSchema = z
  .object({
    content: z.string().trim().min(1),
  })
  .strict();

export async function GET(): Promise<NextResponse> {
  const items = await listInboxItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = inboxCaptureRequestSchema.parse(await request.json());
    const item = await createInboxItem(payload);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid inbox payload',
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    throw error;
  }
}
