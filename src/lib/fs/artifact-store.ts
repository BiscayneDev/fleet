import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { artifactSchema } from '../fleet/schemas';
import type { Artifact, ArtifactType } from '../fleet/types';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter';
import { resolveDataPath } from './path-utils';

const PROJECTS_DIRECTORY = 'Projects';
const ARTIFACTS_DIRECTORY = 'artifacts';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function getArtifactsDirectory(projectSlug: string): string {
  return resolveDataPath(
    path.join(PROJECTS_DIRECTORY, projectSlug, ARTIFACTS_DIRECTORY),
  );
}

function getArtifactPath(projectSlug: string, artifactSlug: string): string {
  return path.join(getArtifactsDirectory(projectSlug), `${artifactSlug}.md`);
}

export interface CreateArtifactInput {
  title: string;
  type: ArtifactType;
  body: string;
  sourcePageSlugs?: string[];
}

export async function writeArtifact(
  projectSlug: string,
  input: CreateArtifactInput,
): Promise<Artifact> {
  const now = new Date().toISOString();
  const dir = getArtifactsDirectory(projectSlug);
  await mkdir(dir, { recursive: true });

  const baseSlug = slugify(input.title);
  const slug = baseSlug || `artifact-${Date.now()}`;

  const artifact: Artifact = {
    slug,
    title: input.title,
    type: input.type,
    body: input.body,
    sourcePageSlugs: input.sourcePageSlugs ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const frontmatter: Record<string, unknown> = {
    slug: artifact.slug,
    title: artifact.title,
    type: artifact.type,
    sourcePageSlugs: artifact.sourcePageSlugs,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  };

  const markdown = stringifyMarkdownFile(frontmatter, artifact.body);
  await writeFile(getArtifactPath(projectSlug, slug), markdown, 'utf8');

  return artifact;
}

export async function listArtifacts(projectSlug: string): Promise<Artifact[]> {
  const dir = getArtifactsDirectory(projectSlug);

  try {
    await mkdir(dir, { recursive: true });
    const entries = await readdir(dir, { withFileTypes: true });

    const artifacts = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map(async (e) => {
          try {
            const content = await readFile(path.join(dir, e.name), 'utf8');
            const { frontmatter, body } = parseMarkdownFile(content);
            return artifactSchema.parse({
              ...frontmatter,
              body,
              slug: e.name.replace(/\.md$/, ''),
            });
          } catch {
            return null;
          }
        }),
    );

    return artifacts
      .filter((a): a is Artifact => a !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function getArtifact(
  projectSlug: string,
  artifactSlug: string,
): Promise<Artifact | null> {
  try {
    const content = await readFile(
      getArtifactPath(projectSlug, artifactSlug),
      'utf8',
    );
    const { frontmatter, body } = parseMarkdownFile(content);
    return artifactSchema.parse({ ...frontmatter, body, slug: artifactSlug });
  } catch {
    return null;
  }
}
