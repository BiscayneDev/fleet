import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ScrapeResult {
  ok: true;
  title: string;
  text: string;
  url: string;
}

export interface ScrapeError {
  ok: false;
  error: string;
}

export type ScrapeResponse = ScrapeResult | ScrapeError;

export async function scrapeUrl(url: string): Promise<ScrapeResponse> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, error: 'Invalid protocol' };
    }
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Fleet/1.0; +https://fleet.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return { ok: false, error: 'Could not extract readable content' };
    }

    return {
      ok: true,
      title: article.title ?? 'Untitled',
      text: article.textContent?.trim() ?? '',
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
