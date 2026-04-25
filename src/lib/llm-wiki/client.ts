import type { InboxItem } from '@/lib/fs/inbox-store';
import type { WikiPageType } from '@/lib/fleet/types';

import { createMockLlmWikiClient } from './mock';
import { createRealLlmWikiClient } from './real';

export const DEFAULT_LLM_WIKI_ADAPTER = 'mock';

function resolveLlmWikiAdapter(): string {
  return process.env.LLM_WIKI_ADAPTER ?? DEFAULT_LLM_WIKI_ADAPTER;
}

export interface LlmWikiPage {
  id: string;
  type: WikiPageType;
  title: string;
  summary: string;
  sourceId: string;
}

export interface LlmWikiIngestInput {
  source: InboxItem;
}

export interface LlmWikiQueryInput {
  prompt: string;
}

export interface LlmWikiCompoundInput {
  prompt: string;
}

export interface LlmWikiLintInput {
  content: string;
}

export interface LlmWikiClient {
  init(): Promise<{ status: 'ready' }>;
  ingest(input: LlmWikiIngestInput): Promise<{
    status: 'processed';
    pages: LlmWikiPage[];
  }>;
  query(input: LlmWikiQueryInput): Promise<{
    status: 'ok';
    answer: string;
    pages: LlmWikiPage[];
  }>;
  compound(input: LlmWikiCompoundInput): Promise<{
    status: 'ok';
    steps: string[];
  }>;
  lint(input: LlmWikiLintInput): Promise<{
    status: 'ok';
    issues: string[];
  }>;
}

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
