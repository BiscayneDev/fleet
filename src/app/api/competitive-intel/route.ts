import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { scrapeUrl } from '@/lib/llm-wiki/scraper';
import { getProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { writeArtifact } from '@/lib/fs/artifact-store';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error('LLM_WIKI_API_KEY or NOUS_API_KEY must be set');
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

function buildCompetitivePrompt(
  projectTitle: string,
  projectSummary: string,
  projectGoals: string[],
  existingIntel: string,
  competitorTitle: string,
  competitorContent: string,
  competitorUrl: string,
): string {
  return `You are Fleet, a world-class competitive intelligence analyst working for a startup founder.

## YOUR PROJECT
- **Name:** ${projectTitle}
- **Summary:** ${projectSummary}
${projectGoals.length > 0 ? `- **Goals:** ${projectGoals.join('; ')}` : ''}

## EXISTING INTELLIGENCE
${existingIntel || 'No prior research captured yet.'}

## COMPETITOR PAGE
**URL:** ${competitorUrl}
**Title:** ${competitorTitle}
**Content:**
${competitorContent.slice(0, 6000)}

---

Generate a comprehensive competitive analysis. Be specific, data-driven, and actionable. Use the exact markdown format below:

# Competitive Analysis: ${competitorTitle}

## Company Overview
What they do, who they serve, and their market position. Include any visible details about founding, funding, team size, or traction.

## Product Comparison

| Feature | ${competitorTitle} | ${projectTitle} | Advantage |
|---------|-----------|---------------|-----------|

Include 6-8 rows comparing key features, capabilities, pricing approach, integrations, target market, and unique differentiators. Be honest about both sides.

## Pricing Analysis
Their pricing model, visible tiers, and how this positions them in the market. Note any pricing vulnerabilities or opportunities.

## Positioning Gaps
Identify 3-5 specific areas where this competitor is weak, underserving their market, or leaving openings. Be concrete — don't say "they could improve UX," say exactly what's missing and why it matters to customers.

## Attack Angles
Provide 3-5 concrete GTM moves ${projectTitle} can make to exploit these gaps. For each:
- **What to do** (specific tactic)
- **Where** (channel: LinkedIn, Product Hunt, Reddit, cold email, etc.)
- **Why it works** (connects gap to our strength)

## Key Takeaway
One sentence: the single most important competitive insight from this analysis.`;
}

export async function POST(request: Request) {
  try {
    const { url, projectSlug } = await request.json();

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }

    if (!projectSlug || typeof projectSlug !== 'string') {
      return Response.json({ error: 'projectSlug is required' }, { status: 400 });
    }

    // Load project context
    let project;
    try {
      project = await getProject(projectSlug);
    } catch {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Scrape competitor URL
    const scraped = await scrapeUrl(url);
    if (!scraped.ok) {
      return Response.json({ error: `Failed to scrape: ${scraped.error}` }, { status: 422 });
    }

    // Build context from existing intel
    const [wikiPages, artifacts] = await Promise.all([
      listWikiPages(projectSlug),
      listArtifacts(projectSlug),
    ]);

    const existingIntel = wikiPages
      .slice(0, 10)
      .map((p) => `- **${p.title}** (${p.type}): ${p.summary}`)
      .join('\n');

    // Build the competitive analysis prompt
    const systemPrompt = buildCompetitivePrompt(
      project.title,
      project.summary,
      project.goals,
      existingIntel,
      scraped.title,
      scraped.text,
      url,
    );

    const { provider, model } = resolveProvider();

    // Stream the analysis
    const result = streamText({
      model: provider.languageModel(model),
      prompt: systemPrompt,
      temperature: 0.6,
      maxOutputTokens: 4096,
      async onFinish({ text }) {
        // Auto-save as artifact when streaming completes
        try {
          await writeArtifact(projectSlug, {
            title: `Competitive Analysis: ${scraped.title}`,
            type: 'competitive-analysis',
            body: text,
            sourcePageSlugs: [],
          });
        } catch (error) {
          console.error('[competitive-intel] Failed to save artifact:', error);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return Response.json({ error: message }, { status: 500 });
  }
}
