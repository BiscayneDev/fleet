import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { POST, OPTIONS } from '@/app/api/waitlist/signup/route';
import { upsertWaitlist, listSignups } from '@/lib/fs/waitlist-store';

function makeRequest(
  body: unknown,
  opts: { token?: string; origin?: string } = {},
): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  if (opts.origin) headers['Origin'] = opts.origin;

  return new Request('http://localhost:3000/api/waitlist/signup', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist/signup', () => {
  let tempVault: string;
  let originalVault: string | undefined;
  let originalToken: string | undefined;

  beforeEach(async () => {
    originalVault = process.env.FLEET_VAULT_ROOT;
    originalToken = process.env.FLEET_SIGNUP_TOKEN;
    tempVault = await mkdtemp(path.join(tmpdir(), 'fleet-signup-route-'));
    process.env.FLEET_VAULT_ROOT = tempVault;
  });

  afterEach(async () => {
    await rm(tempVault, { recursive: true, force: true });
    if (originalVault === undefined) delete process.env.FLEET_VAULT_ROOT;
    else process.env.FLEET_VAULT_ROOT = originalVault;
    if (originalToken === undefined) delete process.env.FLEET_SIGNUP_TOKEN;
    else process.env.FLEET_SIGNUP_TOKEN = originalToken;
  });

  it('returns 503 when FLEET_SIGNUP_TOKEN is unset (disabled by default)', async () => {
    delete process.env.FLEET_SIGNUP_TOKEN;
    const res = await POST(
      makeRequest({ product: 'p', email: 'a@b.com' }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/disabled/i);
  });

  it('returns 401 with no auth header', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    const res = await POST(
      makeRequest({ product: 'p', email: 'a@b.com' }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong bearer token', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    const res = await POST(
      makeRequest({ product: 'p', email: 'a@b.com' }, { token: 'wrong' }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    const res = await POST(
      makeRequest({ product: 'p', email: 'not-an-email' }, { token: 'secret' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when product has no waitlist configured', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    const res = await POST(
      makeRequest(
        { product: 'unknown', email: 'a@b.com' },
        { token: 'secret' },
      ),
    );
    expect(res.status).toBe(404);
  });

  it('writes signup on valid request', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    await upsertWaitlist({ product: 'inference' });

    const res = await POST(
      makeRequest(
        {
          product: 'inference',
          email: 'Chris@UsePod.ai',
          name: 'Chris',
          context: 'Building agents',
          source: 'web-form',
        },
        { token: 'secret' },
      ),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.signupId).toBeTruthy();

    const signups = await listSignups('inference');
    expect(signups).toHaveLength(1);
    expect(signups[0].email).toBe('chris@usepod.ai'); // normalized
    expect(signups[0].source).toBe('web-form');
  });

  it('silently discards honeypot submissions', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    await upsertWaitlist({ product: 'inference' });

    const res = await POST(
      makeRequest(
        {
          product: 'inference',
          email: 'bot@spam.com',
          honeypot: 'i-am-a-bot',
        },
        { token: 'secret' },
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.discarded).toBe(true);

    const signups = await listSignups('inference');
    expect(signups).toHaveLength(0);
  });

  it('defaults source to "external" when not provided', async () => {
    process.env.FLEET_SIGNUP_TOKEN = 'secret';
    await upsertWaitlist({ product: 'p' });

    await POST(
      makeRequest({ product: 'p', email: 'a@b.com' }, { token: 'secret' }),
    );

    const signups = await listSignups('p');
    expect(signups[0].source).toBe('external');
  });

  it('OPTIONS returns CORS preflight headers', () => {
    const req = new Request('http://localhost/x', {
      method: 'OPTIONS',
      headers: { Origin: 'https://openshipyard.xyz' },
    });
    const res = OPTIONS(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://openshipyard.xyz',
    );
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
