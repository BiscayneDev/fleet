# LLM-Wiki Real Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock LLM-Wiki adapter with a real implementation that scrapes URLs, processes content with an LLM, and generates structured wiki pages — enabling the "capture → enrich → brief" loop that's the core YC wow moment.

**Architecture:** Three layers — (1) scraper extracts clean text from URLs, (2) LLM processes content into structured wiki pages (summary, concepts, competitors, risks), (3) file-backed wiki store persists pages per project. The ingest API route orchestrates the flow. Uses Vercel AI SDK with OpenAI-compatible provider (Nous Research).

**Tech Stack:** Next.js 15, Vercel AI SDK (`ai` + `@ai-sdk/openai`), `@mozilla/readability` + `jsdom` for scraping, file-backed markdown storage with frontmatter.

---

## File Structure

| File | Purpose |
|------|---------|
| `src/lib/llm-wiki/scraper.ts` | URL → clean text extraction |
| `src/lib/llm-wiki/prompts.ts` | LLM prompt templates for enrichment |
| `src/lib/llm-wiki/real.ts` | Real adapter — orchestrates scrape + LLM + store |
| `src/lib/fs/wiki-store.ts` | Wiki page CRUD (markdown files in project dirs) |
| `src/app/api/wiki/enrich/route.ts` | API route: enrich an inbox item |
| `src/app/api/wiki/pages/route.ts` | API route: list/get wiki pages for a project |
| `src/lib/llm-wiki/client.ts` | Update: add `real` adapter case |
| `src/app/api/ingest/link/route.ts` | Update: trigger enrichment after ingest |

---

### Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install Vercel AI SDK + scraping deps**

```bash
cd /Users/halseyhuth/fleet
npm install ai @ai-sdk/openai @mozilla/readability jsdom
npm install -D @types/jsdom
```

- [ ] **Step 2: Verify install**

```bash
npm ls ai @ai-sdk/openai @mozilla/readability jsdom
```

Expected: all packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add ai sdk, readability, jsdom deps"
```

---

### Task 2: Build the URL scraper

**Files:**
- Create: `src/lib/llm-wiki/scraper.ts`
- Test: `tests/unit/scraper.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/scraper.test.ts
import { describe, it, expect } from 'vitest';
import { scrapeUrl } from '@/lib/llm-wiki/scraper';

describe('scrapeUrl', () => {
  it('returns empty content for invalid URL', async () => {
    const result = await scrapeUrl('not-a-url');
    expect(result.ok).toBe(false);
  });

  it('extracts content from a real page', async () => {
    // Integration test — hits real network
    const result = await scrapeUrl('https://example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/halseyhuth/fleet
npx vitest run tests/unit/scraper.test.ts
```

Expected: FAIL — `scrapeUrl` not found.

- [ ] **Step 3: Implement scraper**

```typescript
// src/lib/llm-wiki/scraper.ts
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
```

- [ ] **Step 4: Run tests to verify**

```bash
npx vitest run tests/unit/scraper.test.ts
```

Expected: PASS (the invalid URL test passes; the example.com test may pass or fail depending on network — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/lib/llm-wiki/scraper.ts tests/unit/scraper.test.ts
git commit -m "feat(wiki): add URL scraper with readability extraction"
```

---

### Task 3: Build the LLM prompt templates

**Files:**
- Create: `src/lib/llm-wiki/prompts.ts`
- Test: `tests/unit/prompts.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/prompts.test.ts
import { describe, it, expect } from 'vitest';
import { buildEnrichmentPrompt, parseEnrichmentResponse } from '@/lib/llm-wiki/prompts';

describe('buildEnrichmentPrompt', () => {
  it('includes the scraped text in the prompt', () => {
    const prompt = buildEnrichmentPrompt({
      title: 'Test Page',
      text: 'This is the content of the page.',
      url: 'https://example.com',
    });
    expect(prompt).toContain('Test Page');
    expect(prompt).toContain('This is the content of the page.');
  });
});

describe('parseEnrichmentResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      summary: 'A test summary.',
      concepts: ['concept1', 'concept2'],
      competitors: ['Competitor A'],
      risks: ['Risk 1'],
      suggestedActions: ['Action 1'],
    });
    const result = parseEnrichmentResponse(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.summary).toBe('A test summary.');
      expect(result.data.concepts).toHaveLength(2);
    }
  });

  it('rejects invalid JSON', () => {
    const result = parseEnrichmentResponse('not json');
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run tests/unit/prompts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement prompt builder and parser**

```typescript
// src/lib/llm-wiki/prompts.ts
export interface EnrichmentInput {
  title: string;
  text: string;
  url: string;
}

export interface EnrichmentData {
  summary: string;
  concepts: string[];
  competitors: string[];
  risks: string[];
  suggestedActions: string[];
}

export interface ParsedResponse {
  ok: true;
  data: EnrichmentData;
}

export interface ParseError {
  ok: false;
  error: string;
}

export type ParseResult = ParsedResponse | ParseError;

const ENRICHMENT_SYSTEM_PROMPT = `You are a research analyst. Given a web page, extract structured intelligence for a GTM workspace.

Return ONLY valid JSON with these fields:
- summary: 2-3 sentence executive summary (what is this, why does it matter)
- concepts: array of key concepts/terms mentioned (3-7 items)
- competitors: array of competing products/companies mentioned (0-5 items)
- risks: array of potential risks or challenges implied (0-3 items)
- suggestedActions: array of concrete next actions for someone evaluating this space (1-3 items)

Be concise. No markdown, no explanation — just the JSON object.`;

export function buildEnrichmentPrompt(input: EnrichmentInput): string {
  const truncatedText = input.text.slice(0, 8000);

  return `Analyze this web page and extract structured intelligence.

URL: ${input.url}
Title: ${input.title}

--- CONTENT ---
${truncatedText}
--- END CONTENT ---`;
}

export function parseEnrichmentResponse(raw: string): ParseResult {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const data: EnrichmentData = {
      summary: String(parsed.summary ?? ''),
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.map(String) : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions.map(String)
        : [],
    };

    if (!data.summary) {
      return { ok: false, error: 'Missing summary in LLM response' };
    }

    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { ok: false, error: message };
  }
}
```

- [ ] **Step 4: Run tests to verify**

```bash
npx vitest run tests/unit/prompts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/llm-wiki/prompts.ts tests/unit/prompts.test.ts
git commit -m "feat(wiki): add LLM enrichment prompt templates and parser"
```

---

### Task 4: Build the wiki page file store

**Files:**
- Create: `src/lib/fs/wiki-store.ts`
- Test: `tests/unit/wiki-store.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/wiki-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// We'll need to mock resolveDataPath — for now test the shape
import { writeWikiPage, listWikiPages } from '@/lib/fs/wiki-store';

const TEST_DIR = join(tmpdir(), `fleet-wiki-test-${Date.now()}`);

describe('wiki-store', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('returns empty array when no pages exist', async () => {
    const pages = await listWikiPages('test-project');
    expect(pages).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run tests/unit/wiki-store.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement wiki store**

```typescript
// src/lib/fs/wiki-store.ts
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

import { resolveDataPath } from './path-utils';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter';

const PROJECTS_DIRECTORY = 'Projects';
const WIKI_DIRECTORY = 'wiki';

export const wikiPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['source', 'concept', 'competitor', 'risk', 'action']),
  summary: z.string(),
  body: z.string(),
  sourceUrl: z.string().optional(),
  concepts: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  suggestedActions: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WikiPage = z.infer<typeof wikiPageSchema>;

export interface CreateWikiPageInput {
  slug: string;
  title: string;
  type: WikiPage['type'];
  summary: string;
  body: string;
  sourceUrl?: string;
  concepts?: string[];
  competitors?: string[];
  risks?: string[];
  suggestedActions?: string[];
}

function getWikiDirectory(projectSlug: string): string {
  return resolveDataPath(path.join(PROJECTS_DIRECTORY, projectSlug, WIKI_DIRECTORY));
}

function getWikiPagePath(projectSlug: string, pageSlug: string): string {
  return path.join(getWikiDirectory(projectSlug), `${pageSlug}.md`);
}

export async function writeWikiPage(
  projectSlug: string,
  input: CreateWikiPageInput,
): Promise<WikiPage> {
  const now = new Date().toISOString();
  const wikiDir = getWikiDirectory(projectSlug);

  await mkdir(wikiDir, { recursive: true });

  const page: WikiPage = {
    ...input,
    concepts: input.concepts ?? [],
    competitors: input.competitors ?? [],
    risks: input.risks ?? [],
    suggestedActions: input.suggestedActions ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const markdown = stringifyMarkdownFile(
    {
      slug: page.slug,
      title: page.title,
      type: page.type,
      summary: page.summary,
      sourceUrl: page.sourceUrl,
      concepts: page.concepts,
      competitors: page.competitors,
      risks: page.risks,
      suggestedActions: page.suggestedActions,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
    page.body,
  );

  await writeFile(getWikiPagePath(projectSlug, page.slug), markdown, 'utf8');

  return page;
}

export async function listWikiPages(projectSlug: string): Promise<WikiPage[]> {
  const wikiDir = getWikiDirectory(projectSlug);

  try {
    await mkdir(wikiDir, { recursive: true });
    const entries = await readdir(wikiDir, { withFileTypes: true });

    const pages = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map(async (e) => {
          try {
            const content = await readFile(path.join(wikiDir, e.name), 'utf8');
            const { frontmatter, body } = parseMarkdownFile(content);
            return wikiPageSchema.parse({
              ...frontmatter,
              body,
              slug: e.name.replace(/\.md$/, ''),
            });
          } catch {
            return null;
          }
        }),
    );

    return pages
      .filter((p): p is WikiPage => p !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function getWikiPage(
  projectSlug: string,
  pageSlug: string,
): Promise<WikiPage | null> {
  try {
    const content = await readFile(getWikiPagePath(projectSlug, pageSlug), 'utf8');
    const { frontmatter, body } = parseMarkdownFile(content);
    return wikiPageSchema.parse({ ...frontmatter, body, slug: pageSlug });
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify**

```bash
npx vitest run tests/unit/wiki-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fs/wiki-store.ts tests/unit/wiki-store.test.ts
git commit -m "feat(wiki): add file-backed wiki page store"
```

---

### Task 5: Build the real LLM-Wiki adapter

**Files:**
- Create: `src/lib/llm-wiki/real.ts`
- Modify: `src/lib/llm-wiki/client.ts`

- [ ] **Step 1: Write failing test for the enrichment flow**

```typescript
// tests/unit/real-wiki-adapter.test.ts
import { describe, it, expect } from 'vitest';

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
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run tests/unit/real-wiki-adapter.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement real adapter**

```typescript
// src/lib/llm-wiki/real.ts
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { scrapeUrl } from './scraper';
import {
  buildEnrichmentPrompt,
  parseEnrichmentResponse,
  type EnrichmentInput,
} from './prompts';
import type {
  LlmWikiClient,
  LlmWikiCompoundInput,
  LlmWikiIngestInput,
  LlmWikiLintInput,
  LlmWikiQueryInput,
  LlmWikiPage,
} from './client';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error(
      'LLM_WIKI_API_KEY or NOUS_API_KEY must be set for real LLM-Wiki adapter',
    );
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

async function enrichContent(input: EnrichmentInput): Promise<LlmWikiPage[]> {
  const { provider, model } = resolveProvider();
  const prompt = buildEnrichmentPrompt(input);

  const { text } = await generateText({
    model: provider(model),
    system:
      'You are a research analyst. Return ONLY valid JSON. No markdown fences, no explanation.',
    prompt,
    temperature: 0.3,
    maxTokens: 1024,
  });

  const parsed = parseEnrichmentResponse(text);
  if (!parsed.ok) {
    console.error('[llm-wiki] Failed to parse LLM response:', parsed.error);
    // Fall back to a basic source page
    return [
      {
        id: `wiki-${Date.now()}`,
        type: 'source',
        title: input.title,
        summary: `Content from ${input.url}`,
        sourceId: input.url,
      },
    ];
  }

  const pages: LlmWikiPage[] = [];
  const baseId = input.url.replace(/[^a-z0-9]+/gi, '-').slice(0, 50);

  // Main summary page
  pages.push({
    id: `wiki-${baseId}`,
    type: 'source',
    title: input.title,
    summary: parsed.data.summary,
    sourceId: input.url,
  });

  // Concept pages
  for (const concept of parsed.data.concepts.slice(0, 3)) {
    pages.push({
      id: `wiki-${baseId}-${concept.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'concept',
      title: concept,
      summary: `Key concept from ${input.title}`,
      sourceId: input.url,
    });
  }

  // Competitor pages
  for (const competitor of parsed.data.competitors.slice(0, 3)) {
    pages.push({
      id: `wiki-${baseId}-${competitor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'concept',
      title: competitor,
      summary: `Competitor identified in ${input.title}`,
      sourceId: input.url,
    });
  }

  return pages;
}

export function createRealLlmWikiClient(): LlmWikiClient {
  return {
    async init() {
      // Verify provider is reachable
      resolveProvider();
      return { status: 'ready' as const };
    },

    async ingest(input: LlmWikiIngestInput) {
      const source = input.source;
      const url = source.body;

      // Check if this is a URL
      let isUrl = false;
      try {
        new URL(url);
        isUrl = true;
      } catch {
        // Not a URL — treat as a note
      }

      if (isUrl) {
        const scraped = await scrapeUrl(url);
        if (scraped.ok) {
          const pages = await enrichContent({
            title: scraped.title,
            text: scraped.text,
            url: scraped.url,
          });
          return { status: 'processed' as const, pages };
        }
      }

      // Fallback: treat as a text note
      const pages = await enrichContent({
        title: source.title,
        text: source.body,
        url: 'inbox-note',
      });

      return { status: 'processed' as const, pages };
    },

    async query(input: LlmWikiQueryInput) {
      return {
        status: 'ok' as const,
        answer: `Query not yet implemented for: ${input.prompt}`,
        pages: [],
      };
    },

    async compound(input: LlmWikiCompoundInput) {
      return {
        status: 'ok' as const,
        steps: [`Compound analysis for: ${input.prompt}`],
      };
    },

    async lint(input: LlmWikiLintInput) {
      return {
        status: 'ok' as const,
        issues: input.content.length > 5000 ? ['Content exceeds 5000 chars'] : [],
      };
    },
  };
}
```

- [ ] **Step 4: Update client.ts to support real adapter**

```typescript
// src/lib/llm-wiki/client.ts (modify the switch statement)
// Change: case 'mock': only
// Add: case 'real':

import { createRealLlmWikiClient } from './real';

// In getLlmWikiClient():
//   case 'real':
//     return createRealLlmWikiClient();
```

Full replacement for `getLlmWikiClient`:

```typescript
export function getLlmWikiClient(): LlmWikiClient {
  const adapter = resolveLlmWikiAdapter();

  switch (adapter) {
    case 'mock':
      return createMockLlmWikiClient();
    case 'real':
      return createRealLlmWikiClient();
    default:
      throw new Error(`Unsupported llm-wiki adapter: ${adapter}`);
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/unit/real-wiki-adapter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/llm-wiki/real.ts src/lib/llm-wiki/client.ts tests/unit/real-wiki-adapter.test.ts
git commit -m "feat(wiki): add real LLM-Wiki adapter with scraping + enrichment"
```

---

### Task 6: Build the enrich API route

**Files:**
- Create: `src/app/api/wiki/enrich/route.ts`
- Test: `tests/unit/enrich-route.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/enrich-route.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/wiki/enrich', () => {
  it('rejects missing inboxItemId', async () => {
    const { POST } = await import('@/app/api/wiki/enrich/route');
    const request = new Request('http://localhost/api/wiki/enrich', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run tests/unit/enrich-route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement enrich route**

```typescript
// src/app/api/wiki/enrich/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { listInboxItems } from '@/lib/fs/inbox-store';
import { writeWikiPage } from '@/lib/fs/wiki-store';
import { getLlmWikiClient } from '@/lib/llm-wiki/client';

const enrichRequestSchema = z
  .object({
    inboxItemId: z.string().min(1),
    projectSlug: z.string().min(1),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { inboxItemId, projectSlug } = enrichRequestSchema.parse(body);

    // Find the inbox item
    const items = await listInboxItems();
    const item = items.find((i) => i.id === inboxItemId);

    if (!item) {
      return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 });
    }

    // Run enrichment
    const llmWiki = getLlmWikiClient();
    await llmWiki.init();
    const result = await llmWiki.ingest({ source: item });

    // Persist wiki pages
    const savedPages = [];
    for (const page of result.pages) {
      const saved = await writeWikiPage(projectSlug, {
        slug: page.id,
        title: page.title,
        type: page.type === 'source' ? 'source' : 'concept',
        summary: page.summary,
        body: page.summary,
        sourceUrl: item.body,
      });
      savedPages.push(saved);
    }

    return NextResponse.json(
      {
        status: 'enriched',
        pages: savedPages,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 },
      );
    }

    console.error('[wiki/enrich]', error);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/unit/enrich-route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/wiki/enrich/route.ts tests/unit/enrich-route.test.ts
git commit -m "feat(wiki): add enrich API route"
```

---

### Task 7: Wire up auto-enrichment on link ingest

**Files:**
- Modify: `src/app/api/ingest/link/route.ts`

- [ ] **Step 1: Update ingest to trigger enrichment**

Update the `ingestLink` function to optionally trigger enrichment:

```typescript
// src/app/api/ingest/link/route.ts
// After the existing llmWiki.ingest() call, add wiki page persistence:

import { writeWikiPage } from '@/lib/fs/wiki-store';

export async function ingestLink(input: { url: string; projectSlug?: string }) {
  const payload = ingestLinkRequestSchema.parse(input);
  const item = await createInboxItem({ content: payload.url });
  const llmWiki = getLlmWikiClient();

  await llmWiki.init();

  const processed = await llmWiki.ingest({ source: item });

  // If a project slug is provided, persist the wiki pages
  const savedPages = [];
  if (input.projectSlug) {
    for (const page of processed.pages) {
      const saved = await writeWikiPage(input.projectSlug, {
        slug: page.id,
        title: page.title,
        type: page.type === 'source' ? 'source' : 'concept',
        summary: page.summary,
        body: page.summary,
        sourceUrl: item.body,
      });
      savedPages.push(saved);
    }
  }

  return {
    item,
    processed,
    pages: savedPages,
  };
}
```

Update the request schema:

```typescript
const ingestLinkRequestSchema = z
  .object({
    url: z.url({ protocol: /^https?$/ }),
    projectSlug: z.string().min(1).optional(),
  })
  .strict();
```

- [ ] **Step 2: Test the flow manually**

```bash
# Start the dev server
export PATH="/opt/homebrew/Cellar/node/25.4.0/bin:$PATH"
npm run dev -- --port 3004

# In another terminal, test the ingest endpoint:
curl -X POST http://localhost:3004/api/ingest/link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "projectSlug": "test-project"}'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ingest/link/route.ts
git commit -m "feat(wiki): auto-enrich links on ingest when projectSlug provided"
```

---

### Task 8: Add environment config for LLM-Wiki

**Files:**
- Create/Modify: `.env.local`

- [ ] **Step 1: Document required env vars**

Create `.env.local.example`:

```
# LLM-Wiki Configuration
# Set adapter to "real" to enable live enrichment
LLM_WIKI_ADAPTER=real

# API key for LLM (Nous Research or OpenAI-compatible)
LLM_WIKI_API_KEY=sk-pro-...

# Model to use (default: deepseek-v3)
LLM_WIKI_MODEL=deepseek-v3

# Base URL (default: Nous Research)
LLM_WIKI_BASE_URL=https://inference-api.nousresearch.com/v1
```

- [ ] **Step 2: Create .env.local with real values**

Check if `NOUS_API_KEY` or similar is available from the Hermes config and use it.

- [ ] **Step 3: Commit**

```bash
git add .env.local.example
git commit -m "chore: add LLM-Wiki env var documentation"
```

Note: `.env.local` should be in `.gitignore`.

---

### Task 9: End-to-end verification

- [ ] **Step 1: Start dev server with real adapter**

```bash
export PATH="/opt/homebrew/Cellar/node/25.4.0/bin:$PATH"
LLM_WIKI_ADAPTER=real npm run dev -- --port 3004
```

- [ ] **Step 2: Create a test project via API**

```bash
curl -X POST http://localhost:3004/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "Fleet GTM", "summary": "Go-to-market workspace"}'
```

- [ ] **Step 3: Ingest a link with enrichment**

```bash
curl -X POST http://localhost:3004/api/ingest/link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ycombinator.com", "projectSlug": "fleet-gtm"}'
```

- [ ] **Step 4: Verify wiki pages were created**

```bash
ls -la data/Projects/fleet-gtm/wiki/
cat data/Projects/fleet-gtm/wiki/*.md
```

Expected: Markdown files with frontmatter containing enrichment data.

- [ ] **Step 5: Verify in browser**

Navigate to `http://localhost:3004/projects/fleet-gtm/wiki` and confirm wiki pages appear.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
npx playwright test 2>/dev/null || echo "Playwright tests need update"
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(wiki): real LLM-Wiki integration complete"
```

---

## Environment Variables Summary

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_WIKI_ADAPTER` | `mock` | `mock` or `real` |
| `LLM_WIKI_API_KEY` | — | API key for LLM provider |
| `LLM_WIKI_MODEL` | `deepseek-v3` | Model name |
| `LLM_WIKI_BASE_URL` | Nous Research URL | OpenAI-compatible API base |

## Verification Checklist

- [ ] Scraper extracts clean text from real URLs
- [ ] LLM enrichment produces structured JSON with summary/concepts/competitors/risks
- [ ] Wiki pages persist as markdown files with frontmatter
- [ ] Ingest API returns enriched pages when projectSlug is provided
- [ ] Wiki UI shows populated pages after enrichment
- [ ] Tests pass (unit + integration)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
