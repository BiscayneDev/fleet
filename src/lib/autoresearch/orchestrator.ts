import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { getProject } from '../fs/project-store';
import { listWikiPages, writeWikiPage } from '../fs/wiki-store';
import { listArtifacts, writeArtifact } from '../fs/artifact-store';
import { scrapeUrl } from '../llm-wiki/scraper';
import { enrichContent } from '../llm-wiki/real';
import { webSearch } from './search';
import { generateResearchQueries } from './queries';
import {
  searchMarketplace,
  formatListingForResearch,
} from '../shipyard/client';

import type { WikiPage } from '../fs/wiki-store';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

export interface AutoresearchResult {
  queriesUsed: string[];
  urlsScraped: number;
  wikiPagesCreated: number;
  reportSlug: string;
}

async function scrapeAndEnrich(
  url: string,
  projectSlug: string,
): Promise<WikiPage[]> {
  const scraped = await scrapeUrl(url);
  if (!scraped.ok) return [];

  const pages = await enrichContent({
    title: scraped.title,
    text: scraped.text,
    url: scraped.url,
  });

  const wikiPages: WikiPage[] = [];

  for (const page of pages) {
    const slug = page.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    try {
      const written = await writeWikiPage(projectSlug, {
        slug,
        title: page.title,
        type: page.type === 'source' || page.type === 'concept' ? page.type : 'source',
        summary: page.summary,
        body: `Source: ${url}\n\n${page.summary}`,
        sourceUrl: url,
      });
      wikiPages.push(written);
    } catch {
      // Skip duplicates or write errors
    }
  }

  return wikiPages;
}

async function synthesizeReport(
  projectTitle: string,
  queries: string[],
  newPages: WikiPage[],
): Promise<string> {
  const { provider, model } = resolveProvider();

  const findings = newPages
    .map((p) => {
      const parts = [`### ${p.title}`];
      if (p.sourceUrl) parts.push(`Source: ${p.sourceUrl}`);
      if (p.summary) parts.push(p.summary);
      if (p.concepts.length > 0) parts.push(`Concepts: ${p.concepts.join(', ')}`);
      if (p.competitors.length > 0) parts.push(`Competitors: ${p.competitors.join(', ')}`);
      if (p.risks.length > 0) parts.push(`Risks: ${p.risks.join(', ')}`);
      return parts.join('\n');
    })
    .join('\n\n');

  const result = await generateText({
    model: provider.languageModel(model),
    system: 'You are a GTM strategist synthesizing web research into actionable intelligence.',
    prompt: `Synthesize these research findings into a GTM Validation Report for "${projectTitle}".

## Search Queries Used
${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Research Findings
${findings || 'No research results were found.'}

---

Create a structured report with these sections:
## Market Demand Signals
What evidence exists that people want this?

## Competitive Landscape
Who else is doing this? How are they positioned?

## ICP Validation
Where does the target audience actually spend time online?

## Channel Opportunities
Which distribution channels show the most promise?

## Risks & Red Flags
What should the founder be worried about?

## Recommended Next Steps
Top 3-5 specific actions based on this research.

Be specific. Reference actual companies, communities, URLs, and data points. Flag any GTM assumptions that the research contradicts.`,
    temperature: 0.5,
    maxOutputTokens: 4096,
  });

  return result.text;
}

async function searchShipyardForProject(
  projectTitle: string,
  projectSummary: string,
  projectSlug: string,
): Promise<WikiPage[]> {
  const pages: WikiPage[] = [];

  try {
    // Search marketplace with project title and summary keywords
    const keywords = projectTitle.split(/\s+/).slice(0, 3).join(' ');
    const result = await searchMarketplace(keywords, 10);

    if (result.listings.length === 0) {
      return pages;
    }

    for (const listing of result.listings) {
      const slug = `shipyard-${listing.slug}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

      const body = formatListingForResearch(listing);

      try {
        const written = await writeWikiPage(projectSlug, {
          slug,
          title: `[Shipyard] ${listing.name}`,
          type: 'source',
          summary: listing.short_description ?? `${listing.name} — API on Shipyard Marketplace`,
          body: `Source: Shipyard Marketplace\n\n${body}`,
          sourceUrl: `https://openshipyard.xyz/marketplace/${listing.slug}`,
        });
        pages.push(written);
      } catch {
        // Skip duplicates
      }
    }
  } catch {
    // Shipyard search failure should not block research
  }

  return pages;
}

export async function runAutoresearch(
  projectSlug: string,
): Promise<AutoresearchResult> {
  const project = await getProject(projectSlug);
  const [wikiPages, artifacts] = await Promise.all([
    listWikiPages(projectSlug),
    listArtifacts(projectSlug),
  ]);

  // Step 1: Generate search queries
  const queries = await generateResearchQueries(project, wikiPages, artifacts);

  // Step 2: Execute searches
  const allUrls = new Set<string>();
  const existingUrls = new Set(
    wikiPages
      .map((p) => p.sourceUrl)
      .filter((u): u is string => Boolean(u)),
  );

  for (const query of queries) {
    const result = await webSearch(query, 3);
    if (result.ok) {
      for (const r of result.results) {
        if (!existingUrls.has(r.link)) {
          allUrls.add(r.link);
        }
      }
    }
  }

  // Step 3: Scrape and enrich (batch 3 at a time)
  const urls = [...allUrls];
  const newPages: WikiPage[] = [];

  for (let i = 0; i < urls.length; i += 3) {
    const batch = urls.slice(i, i + 3);
    const results = await Promise.all(
      batch.map((url) => scrapeAndEnrich(url, projectSlug)),
    );
    for (const pages of results) {
      newPages.push(...pages);
    }
  }

  // Step 4: Search Shipyard Marketplace
  const shipyardPages = await searchShipyardForProject(
    project.title,
    project.summary,
    projectSlug,
  );
  newPages.push(...shipyardPages);

  // Step 5: Synthesize validation report
  const reportBody = await synthesizeReport(project.title, queries, newPages);

  const report = await writeArtifact(projectSlug, {
    title: `GTM Validation Report — ${project.title}`,
    type: 'report',
    body: reportBody,
    sourcePageSlugs: newPages.map((p) => p.slug),
  });

  return {
    queriesUsed: queries,
    urlsScraped: urls.length,
    wikiPagesCreated: newPages.length,
    reportSlug: report.slug,
  };
}
