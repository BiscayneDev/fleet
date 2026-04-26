import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { Project } from '../fleet/types';
import type { Connection } from '../fleet/types';
import type { WikiPage } from '../fs/wiki-store';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error('LLM API key must be set for network analysis');
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

function buildConnectionsSummary(connections: Connection[]): string {
  return connections
    .map((c) => {
      const parts = [`- ${c.displayName} (@${c.handle}, ${c.platform})`];
      if (c.company) parts.push(`  Company: ${c.company}`);
      if (c.position) parts.push(`  Role: ${c.position}`);
      if (c.bio) parts.push(`  Bio: ${c.bio}`);
      return parts.join('\n');
    })
    .join('\n');
}

function buildProjectSummary(project: Project, wikiPages: WikiPage[]): string {
  const parts = [
    `Project: ${project.title}`,
    `Summary: ${project.summary}`,
  ];

  if (project.goals.length > 0) {
    parts.push(`Goals: ${project.goals.join('; ')}`);
  }
  if (project.desiredOutcomes.length > 0) {
    parts.push(`Desired Outcomes: ${project.desiredOutcomes.join('; ')}`);
  }

  if (wikiPages.length > 0) {
    parts.push('');
    parts.push('Captured research:');
    for (const page of wikiPages.slice(0, 20)) {
      const line = `- ${page.title}: ${page.summary.slice(0, 150)}`;
      if (page.competitors.length > 0) {
        parts.push(`${line} (competitors: ${page.competitors.join(', ')})`);
      } else {
        parts.push(line);
      }
    }
  }

  return parts.join('\n');
}

function preFilterConnections(
  connections: Connection[],
  project: Project,
  wikiPages: WikiPage[],
): Connection[] {
  const keywords = new Set<string>();

  const addWords = (text: string) => {
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3)
      .forEach((w) => keywords.add(w));
  };

  addWords(project.title);
  addWords(project.summary);
  for (const g of project.goals) addWords(g);
  for (const o of project.desiredOutcomes) addWords(o);
  for (const page of wikiPages) {
    addWords(page.title);
    addWords(page.summary);
    for (const c of page.competitors) addWords(c);
    for (const c of page.concepts) addWords(c);
  }

  const scored = connections.map((conn) => {
    let score = 0;
    const searchable = [
      conn.displayName,
      conn.company,
      conn.position,
      conn.bio,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    for (const kw of keywords) {
      if (searchable.includes(kw)) score++;
    }

    return { conn, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 100).map((s) => s.conn);
}

export async function analyzeNetworkForProject(
  connections: Connection[],
  project: Project,
  wikiPages: WikiPage[],
): Promise<string> {
  const filtered = preFilterConnections(connections, project, wikiPages);

  if (filtered.length === 0) {
    return 'No connections found that match this project context. Try importing more connections or adding more project context.';
  }

  const { provider, model } = resolveProvider();

  const prompt = `You are a GTM strategist analyzing a founder's professional network for go-to-market opportunities.

## Project Context
${buildProjectSummary(project, wikiPages)}

## Founder's Network (${filtered.length} most relevant connections from ${connections.length} total)
${buildConnectionsSummary(filtered)}

## Your Task
Analyze these connections and produce a structured GTM network analysis:

1. **High-Value Connections** — Rank the top 10-15 connections most valuable for this project's GTM. For each, explain:
   - Why they're relevant (specific to the project)
   - Suggested action (intro request, partnership pitch, beta invite, etc.)
   - Priority: Critical / High / Medium

2. **Opportunity Clusters** — Group connections by GTM opportunity type:
   - Potential Customers: people at companies matching the ICP
   - Distribution Partners: people who could amplify reach
   - Strategic Advisors: experienced people who could guide GTM
   - Warm Intros: people who could connect to target accounts
   - Co-Marketing Allies: people building complementary products

3. **Network Gaps** — What's missing? What types of connections should the founder build to strengthen their GTM?

4. **Recommended Outreach Sequence** — A prioritized list of 5 people to reach out to first, with a one-line suggested message for each.

Be specific and actionable. Reference actual connection names and companies. Do NOT be generic.`;

  const result = await generateText({
    model: provider.languageModel(model),
    prompt,
    temperature: 0.5,
    maxOutputTokens: 4096,
  });

  return result.text;
}
