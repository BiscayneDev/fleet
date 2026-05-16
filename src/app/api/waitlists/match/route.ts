import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { runMatcher } from '@/lib/waitlist/matcher';

const matchRequestSchema = z
  .object({
    product: z.string().trim().optional(),
    vaultContactsDir: z.string().trim().optional(),
  })
  .strict()
  .optional();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json().catch(() => ({}));
    const payload = matchRequestSchema.parse(raw) ?? {};
    const result = await runMatcher({
      productFilter: payload.product,
      vaultContactsDir: payload.vaultContactsDir,
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid match request', issues: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }
}
