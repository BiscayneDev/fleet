import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { Project, Artifact } from '../fleet/types';
import type { WikiPage } from '../fs/wiki-store';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error('LLM API key must be set');
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

export async function generateResearchQueries(
  project: Project,
  wikiPages: WikiPage[],
  artifacts: Artifact[],
): Promise<string[]> {
  const contextParts: string[] = [
    `Project: ${project.title}`,
    `Summary: ${project.summary}`,
  ];

  if (project.goals.length > 0) {
    contextParts.push(`Goals: ${project.goals.join('; ')}`);
  }

  if (wikiPages.length > 0) {
    contextParts.push('Existing research:');
    for (const page of wikiPages.slice(0, 10)) {
      contextParts.push(`- ${page.title}: ${page.summary.slice(0, 100)}`);
    }
  }

  if (artifacts.length > 0) {
    contextParts.push('GTM artifacts generated:');
    for (const a of artifacts.slice(0, 5)) {
      contextParts.push(`- ${a.title} (${a.type})`);
    }
  }

  const { provider, model } = resolveProvider();

  const result = await generateText({
    model: provider.languageModel(model),
    system: 'You are a GTM research strategist. Return ONLY a valid JSON array of strings. No explanation, no markdown fences.',
    prompt: `Given this project context, generate exactly 6 web search queries that would validate the go-to-market strategy. Focus on:
1. Competitor intelligence (what are competitors doing, pricing, features)
2. ICP community discovery (Reddit threads, HN discussions, forums where target users discuss this problem)
3. Demand signals (people asking for solutions like this)
4. Pricing benchmarks (how similar products are priced)
5. Channel validation (which distribution channels work for similar products)
6. Market timing (recent trends, funding, launches in this space)

Make queries specific to this project — not generic marketing queries.

${contextParts.join('\n')}

Return a JSON array of 6 search query strings:`,
    temperature: 0.5,
    maxOutputTokens: 512,
  });

  try {
    let text = result.text.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    }

    const queries = JSON.parse(text) as unknown;
    if (Array.isArray(queries) && queries.every((q) => typeof q === 'string')) {
      return queries.slice(0, 8);
    }
  } catch {
    // Fallback: generate basic queries from project title
  }

  return [
    `${project.title} competitors`,
    `${project.title} alternatives`,
    `"${project.title}" site:reddit.com`,
    `${project.summary.split(' ').slice(0, 5).join(' ')} market size`,
    `${project.title} pricing`,
    `${project.title} reviews`,
  ];
}
