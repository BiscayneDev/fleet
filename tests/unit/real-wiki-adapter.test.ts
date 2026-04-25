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

describe('createRealLlmWikiClient', () => {
  it('exports a client with all required methods', async () => {
    const { createRealLlmWikiClient } = await import('@/lib/llm-wiki/real');
    const client = createRealLlmWikiClient();
    expect(typeof client.init).toBe('function');
    expect(typeof client.ingest).toBe('function');
    expect(typeof client.query).toBe('function');
    expect(typeof client.compound).toBe('function');
    expect(typeof client.lint).toBe('function');
  });

  it('throws on init when no API key is set', async () => {
    const original = process.env.LLM_WIKI_API_KEY;
    delete process.env.LLM_WIKI_API_KEY;
    delete process.env.NOUS_API_KEY;

    const { createRealLlmWikiClient } = await import('@/lib/llm-wiki/real');
    const client = createRealLlmWikiClient();

    await expect(client.init()).rejects.toThrow('API_KEY');

    // Restore
    if (original) process.env.LLM_WIKI_API_KEY = original;
  });

  it('lint returns issues for long content', async () => {
    const { createRealLlmWikiClient } = await import('@/lib/llm-wiki/real');
    const client = createRealLlmWikiClient();
    const result = await client.lint({ content: 'x'.repeat(6000) });
    expect(result.status).toBe('ok');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
