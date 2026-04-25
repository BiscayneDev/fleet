import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeUrl } from '@/lib/llm-wiki/scraper';

// Mock JSDOM and Readability
vi.mock('jsdom', () => {
  const mockDocument = {
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  };
  return {
    JSDOM: vi.fn().mockImplementation(() => ({
      window: {
        document: mockDocument,
      },
    })),
  };
});

vi.mock('@mozilla/readability', () => ({
  Readability: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      title: 'Example Domain',
      textContent: 'This domain is for use in illustrative examples.',
    }),
  })),
}));

describe('scrapeUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid URL', async () => {
    const result = await scrapeUrl('not-a-url');
    expect(result.ok).toBe(false);
  });

  it('returns error for non-HTTP protocol', async () => {
    const result = await scrapeUrl('ftp://example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Invalid protocol');
    }
  });

  it('extracts content from a page', async () => {
    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<html><body><h1>Example</h1></body></html>'),
    });
    global.fetch = mockFetch;

    const result = await scrapeUrl('https://example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
    }
  });

  it('handles HTTP errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    global.fetch = mockFetch;

    const result = await scrapeUrl('https://example.com/notfound');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('HTTP 404');
    }
  });

  it('handles network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const result = await scrapeUrl('https://example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});
