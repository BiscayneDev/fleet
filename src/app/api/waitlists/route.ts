import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { listWaitlists, upsertWaitlist } from '@/lib/fs/waitlist-store';

const createWaitlistSchema = z
  .object({
    product: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, {
        message: 'Product slug must be lowercase letters, numbers, and dashes',
      }),
    name: z.string().trim().optional(),
    description: z.string().optional(),
  })
  .strict();

export async function GET(): Promise<NextResponse> {
  const waitlists = await listWaitlists();
  return NextResponse.json({ waitlists });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = createWaitlistSchema.parse(await request.json());
    const waitlist = await upsertWaitlist(payload);
    return NextResponse.json({ waitlist }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid waitlist payload', issues: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }
}
