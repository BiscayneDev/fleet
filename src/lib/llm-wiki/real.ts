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
    model: provider.chat(model),
    system:
      'You are a research analyst. Return ONLY valid JSON. No markdown fences, no explanation.',
    prompt,
    temperature: 0.3,
    maxOutputTokens: 1024,
  });

  const parsed = parseEnrichmentResponse(text);
  if (!parsed.ok) {
    console.error('[llm-wiki] Failed to parse LLM response:', (parsed as { error: string }).error);
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
      resolveProvider();
      return { status: 'ready' as const };
    },

    async ingest(input: LlmWikiIngestInput) {
      const source = input.source;
      const url = source.body;

      let isUrl = false;
      try {
        new URL(url);
        isUrl = true;
      } catch {
        // Not a URL
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
