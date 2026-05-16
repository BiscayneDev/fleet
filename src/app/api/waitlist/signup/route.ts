import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { addSignup, getWaitlist } from '@/lib/fs/waitlist-store';

/**
 * Public endpoint for external waitlist signups.
 *
 * Designed to be called from a Fleet user's landing page (typically via a
 * tunnel like cloudflared so the public form on their hosted site can
 * reach this localhost handler).
 *
 * Auth: requires `Authorization: Bearer <FLEET_SIGNUP_TOKEN>` header
 * matching the env var. If the env var is unset, the endpoint is disabled
 * (returns 503) — opt-in by design so an unconfigured Fleet doesn't
 * silently accept signups from anywhere.
 *
 * The honeypot field, if non-empty, silently returns 200 without writing
 * anything (matches fleet-waitlist-submit's behavior).
 */

const signupRequestSchema = z
  .object({
    product: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*$/, {
        message: 'product must be lowercase alphanumerics and dashes',
      }),
    email: z.email().max(254),
    name: z.string().max(200).optional(),
    context: z.string().max(2000).optional(),
    source: z.string().max(50).optional(),
    honeypot: z.string().optional(),
  })
  .strict();

function corsHeaders(origin: string | null): HeadersInit {
  // Permissive CORS by design — this endpoint is meant to be hit from
  // arbitrary landing pages. Bearer token gates writes; CORS is just
  // about letting the browser preflight succeed.
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function OPTIONS(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // Auth gate: explicit opt-in via env var
  const expectedToken = process.env.FLEET_SIGNUP_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      {
        error:
          'Public signup endpoint disabled. Set FLEET_SIGNUP_TOKEN in your Fleet .env.local to enable.',
      },
      { status: 503, headers: cors },
    );
  }

  const auth = request.headers.get('authorization');
  const presented = auth?.startsWith('Bearer ')
    ? auth.slice('Bearer '.length).trim()
    : null;
  if (presented !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: cors },
    );
  }

  try {
    const payload = signupRequestSchema.parse(await request.json());

    // Honeypot: silently accept and drop
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      return NextResponse.json(
        { ok: true, discarded: true },
        { status: 200, headers: cors },
      );
    }

    const waitlist = await getWaitlist(payload.product);
    if (!waitlist) {
      return NextResponse.json(
        {
          error: `No waitlist configured for product "${payload.product}". Create it in Fleet first.`,
        },
        { status: 404, headers: cors },
      );
    }

    const signup = await addSignup({
      product: payload.product,
      email: payload.email,
      name: payload.name,
      context: payload.context,
      source: payload.source ?? 'external',
    });

    return NextResponse.json(
      { ok: true, signupId: signup.id },
      { status: 201, headers: cors },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid signup payload', issues: error.issues },
        { status: 400, headers: cors },
      );
    }
    throw error;
  }
}
