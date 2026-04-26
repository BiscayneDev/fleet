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

export async function enrichContent(input: EnrichmentInput): Promise<LlmWikiPage[]> {
  console.log('[llm-wiki] Enriching:', input.url, 'title:', input.title, 'text length:', input.text.length);
  const { provider, model } = resolveProvider();
  const prompt = buildEnrichmentPrompt(input);

  let text = '';
  let llmWorked = false;
  console.log('[llm-wiki] Calling LLM with model:', model, 'base URL:', process.env.LLM_WIKI_BASE_URL);
  try {
    const result = await generateText({
      model: provider.languageModel(model),
      system:
        'You are a research analyst. Return ONLY valid JSON. No markdown fences, no explanation.',
      prompt,
      temperature: 0.3,
      maxOutputTokens: 1024,
    });
    text = result.text;
    console.log('[llm-wiki] Raw LLM response length:', text.length, 'preview:', text.slice(0, 200));
    llmWorked = text.length > 0;
  } catch (error) {
    console.error('[llm-wiki] LLM error:', error);
  }

  // If LLM worked, try to parse the response
  if (llmWorked) {
    console.log('[llm-wiki] LLM worked, attempting to parse...');
    const parsed = parseEnrichmentResponse(text);
    console.log('[llm-wiki] Parse result:', parsed.ok ? 'success' : 'failed', parsed.ok ? '' : (parsed as { error: string }).error);
    if (parsed.ok) {
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
  }

  // Fallback: use scraped content directly
  const excerpt = input.text.slice(0, 500).replace(/\s+/g, ' ').trim();
  return [
    {
      id: `wiki-${Date.now()}`,
      type: 'source',
      title: input.title,
      summary: excerpt || `Content from ${input.url}`,
      sourceId: input.url,
    },
  ];
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
        console.log('[llm-wiki] Scrape result:', scraped.ok ? 'ok' : 'failed', scraped);
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
