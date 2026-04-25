import { describe, it, expect, vi } from 'vitest';

// Mock jsdom and readability to avoid ESM/CJS issues with Node 25
vi.mock('jsdom', () => ({
  JSDOM: vi.fn().mockImplementation(() => ({
    window: { document: {} },
  })),
}));

vi.mock('@mozilla/readability', () => ({
  Readability: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      title: 'Mock Title',
      textContent: 'Mock content',
    }),
  })),
}));

import { POST } from '@/app/api/wiki/enrich/route';

describe('POST /api/wiki/enrich', () => {
  it('rejects missing inboxItemId', async () => {
    const request = new Request('http://localhost/api/wiki/enrich', {
      method: 'POST',
      body: JSON.stringify({ projectSlug: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects missing projectSlug', async () => {
    const request = new Request('http://localhost/api/wiki/enrich', {
      method: 'POST',
      body: JSON.stringify({ inboxItemId: 'abc' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects empty body', async () => {
    const request = new Request('http://localhost/api/wiki/enrich', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
