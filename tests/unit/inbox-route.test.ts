import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createInboxItem = vi.fn();
const listInboxItems = vi.fn();

vi.mock('@/lib/fs/inbox-store', () => ({
  createInboxItem,
  listInboxItems,
}));

let GET: typeof import('../../src/app/api/inbox/route').GET;
let POST: typeof import('../../src/app/api/inbox/route').POST;

beforeEach(async () => {
  ({ GET, POST } = await import('../../src/app/api/inbox/route'));
});

afterEach(() => {
  createInboxItem.mockReset();
  listInboxItems.mockReset();
});

describe('inbox API route', () => {
  it('returns 201 with the created inbox item', async () => {
    createInboxItem.mockResolvedValue({
      id: 'item-1',
      type: 'note',
      title: 'Inbox note',
      body: 'Inbox note',
      origin: 'inbox',
      projectSlugs: [],
      ingestionStatus: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const response = await POST(
      new Request('http://localhost/api/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'Inbox note' }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      item: {
        id: 'item-1',
        title: 'Inbox note',
      },
    });
    expect(response.status).toBe(201);
    expect(createInboxItem).toHaveBeenCalledWith({ content: 'Inbox note' });
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: '   ' }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid inbox payload',
    });
    expect(response.status).toBe(400);
    expect(createInboxItem).not.toHaveBeenCalled();
  });

  it('returns listed inbox items from GET', async () => {
    listInboxItems.mockResolvedValue([
      {
        id: 'item-1',
        type: 'note',
        title: 'Inbox note',
        body: 'Inbox note',
        origin: 'inbox',
        projectSlugs: [],
        ingestionStatus: 'pending',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      items: [
        {
          id: 'item-1',
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(listInboxItems).toHaveBeenCalledTimes(1);
  });
});