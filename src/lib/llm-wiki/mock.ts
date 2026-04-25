import type {
  LlmWikiClient,
  LlmWikiCompoundInput,
  LlmWikiIngestInput,
  LlmWikiLintInput,
  LlmWikiPage,
  LlmWikiQueryInput,
} from './client';

function buildSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'wiki-page';
}

function buildTitle(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const lastSegment = pathname.split('/').filter(Boolean).at(-1);
    const source = lastSegment || hostname;

    return source
      .split(/[-_]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return 'Captured Link';
  }
}

function buildPages(input: LlmWikiIngestInput): LlmWikiPage[] {
  const sourceId = input.source.id ?? 'source';
  const title = buildTitle(input.source.body);

  return [
    {
      id: `wiki-${buildSlug(sourceId)}`,
      type: 'source',
      title,
      summary: `Captured from ${input.source.body}`,
      sourceId,
    },
  ];
}

export function createMockLlmWikiClient(): LlmWikiClient {
  return {
    async init() {
      return { status: 'ready' as const };
    },
    async ingest(input: LlmWikiIngestInput) {
      return {
        status: 'processed' as const,
        pages: buildPages(input),
      };
    },
    async query(_input: LlmWikiQueryInput) {
      return {
        status: 'ok' as const,
        answer: 'Mock llm-wiki query result.',
        pages: [],
      };
    },
    async compound(_input: LlmWikiCompoundInput) {
      return {
        status: 'ok' as const,
        steps: [],
      };
    },
    async lint(_input: LlmWikiLintInput) {
      return {
        status: 'ok' as const,
        issues: [],
      };
    },
  };
}
