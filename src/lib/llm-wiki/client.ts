import type { InboxItem } from '@/lib/fs/inbox-store';
import type { WikiPageType } from '@/lib/fleet/types';

import { createMockLlmWikiClient } from './mock';

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
  return createMockLlmWikiClient();
}
