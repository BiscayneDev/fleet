import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createInboxItem = vi.fn();
const getLlmWikiClient = vi.fn();
const ingest = vi.fn();

vi.mock('@/lib/fs/inbox-store', () => ({
  createInboxItem,
}));

vi.mock('@/lib/llm-wiki/client', () => ({
  getLlmWikiClient,
}));

let ingestLink: typeof import('../../src/app/api/ingest/link/route').ingestLink;
let POST: typeof import('../../src/app/api/ingest/link/route').POST;

beforeEach(async () => {
  ({ ingestLink, POST } = await import('../../src/app/api/ingest/link/route'));
  getLlmWikiClient.mockReturnValue({
    init: vi.fn().mockResolvedValue({ status: 'ready' }),
    ingest,
    query: vi.fn(),
    compound: vi.fn(),
    lint: vi.fn(),
  });
});

afterEach(() => {
  createInboxItem.mockReset();
  getLlmWikiClient.mockReset();
  ingest.mockReset();
});

describe('link ingest API route', () => {
  it('returns a processed result with created wiki pages', async () => {
    createInboxItem.mockResolvedValue({
      id: 'source-1',
      type: 'link',
      title: 'https://example.com/post',
      body: 'https://example.com/post',
      origin: 'inbox',
      projectSlugs: [],
      ingestionStatus: 'pending',
      createdAt: '2026-04-11T00:00:00.000Z',
      updatedAt: '2026-04-11T00:00:00.000Z',
    });
    ingest.mockResolvedValue({
      status: 'processed',
      pages: [
        {
          id: 'wiki-source-1',
          type: 'source',
          title: 'Example Post',
          summary: 'Captured from the ingested link.',
          sourceId: 'source-1',
        },
      ],
    });

    const result = await ingestLink({ url: 'https://example.com/post' });

    expect(createInboxItem).toHaveBeenCalledWith({ content: 'https://example.com/post' });
    expect(ingest).toHaveBeenCalledWith({
      source: expect.objectContaining({
        id: 'source-1',
        type: 'link',
        body: 'https://example.com/post',
      }),
    });
    expect(result).toMatchObject({
      item: {
        id: 'source-1',
        type: 'link',
      },
      processed: {
        status: 'processed',
        pages: [
          {
            id: 'wiki-source-1',
            type: 'source',
            sourceId: 'source-1',
          },
        ],
      },
    });
  });

  it('returns 201 from POST with the ingest result', async () => {
    createInboxItem.mockResolvedValue({
      id: 'source-1',
      type: 'link',
      title: 'https://example.com/post',
      body: 'https://example.com/post',
      origin: 'inbox',
      projectSlugs: [],
      ingestionStatus: 'pending',
      createdAt: '2026-04-11T00:00:00.000Z',
      updatedAt: '2026-04-11T00:00:00.000Z',
    });
    ingest.mockResolvedValue({
      status: 'processed',
      pages: [
        {
          id: 'wiki-source-1',
          type: 'source',
          title: 'Example Post',
          summary: 'Captured from the ingested link.',
          sourceId: 'source-1',
        },
      ],
    });

    const response = await POST(
      new Request('http://localhost/api/ingest/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/post' }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      item: { id: 'source-1' },
      processed: {
        status: 'processed',
        pages: [{ id: 'wiki-source-1' }],
      },
    });
    expect(response.status).toBe(201);
  });
});
