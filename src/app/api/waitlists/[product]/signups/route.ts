import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { addSignup, getWaitlist } from '@/lib/fs/waitlist-store';

const addSignupSchema = z
  .object({
    email: z.email(),
    name: z.string().trim().optional(),
    context: z.string().optional(),
    source: z.string().trim().optional(),
  })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ product: string }> },
): Promise<NextResponse> {
  try {
    const { product } = await params;
    const waitlist = await getWaitlist(product);
    if (!waitlist) {
      return NextResponse.json(
        { error: 'Waitlist not found' },
        { status: 404 },
      );
    }
    const payload = addSignupSchema.parse(await request.json());
    const signup = await addSignup({ product, ...payload });
    return NextResponse.json({ signup }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid signup payload', issues: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }
}
