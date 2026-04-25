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

  // Build frontmatter, excluding undefined values
  const frontmatter: Record<string, unknown> = {
    slug: page.slug,
    title: page.title,
    type: page.type,
    summary: page.summary,
    concepts: page.concepts,
    competitors: page.competitors,
    risks: page.risks,
    suggestedActions: page.suggestedActions,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };

  if (page.sourceUrl !== undefined) {
    frontmatter.sourceUrl = page.sourceUrl;
  }

  const markdown = stringifyMarkdownFile(frontmatter, page.body);

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
