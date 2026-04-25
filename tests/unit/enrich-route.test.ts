import { describe, it, expect } from 'vitest';
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
