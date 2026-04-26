import { JSDOM } from 'jsdom';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

type SearchResponse =
  | { ok: true; results: SearchResult[] }
  | { ok: false; error: string };

export async function webSearch(
  query: string,
  numResults = 3,
): Promise<SearchResponse> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { ok: false, error: `DuckDuckGo returned ${response.status}` };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const resultElements = doc.querySelectorAll('.result');
    const results: SearchResult[] = [];

    for (const el of resultElements) {
      if (results.length >= numResults) break;

      const titleEl = el.querySelector('.result__a');
      const snippetEl = el.querySelector('.result__snippet');
      const linkEl = el.querySelector('.result__url');

      const title = titleEl?.textContent?.trim() ?? '';
      const snippet = snippetEl?.textContent?.trim() ?? '';

      // Extract actual URL from DuckDuckGo redirect
      let link = '';
      const href = titleEl?.getAttribute('href') ?? '';
      if (href.includes('uddg=')) {
        try {
          const uddg = new URL(`https://duckduckgo.com${href}`).searchParams.get('uddg');
          link = uddg ?? '';
        } catch {
          link = linkEl?.textContent?.trim() ?? '';
        }
      } else if (href.startsWith('http')) {
        link = href;
      } else {
        link = linkEl?.textContent?.trim() ?? '';
      }

      if (title && link && link.startsWith('http')) {
        results.push({ title, link, snippet });
      }
    }

    if (results.length === 0) {
      return { ok: false, error: 'No results found' };
    }

    return { ok: true, results };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return { ok: false, error: message };
  }
}
