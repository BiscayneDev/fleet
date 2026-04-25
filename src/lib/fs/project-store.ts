import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

import {
  projectCreateSchema,
  projectSchema,
  projectUpdateSchema,
} from '../fleet/schemas';
import type { Project } from '../fleet/types';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter';
import { resolveDataPath } from './path-utils';

export type CreateProjectInput = z.infer<typeof projectCreateSchema>;
export type UpdateProjectInput = z.infer<typeof projectUpdateSchema>;

const PROJECTS_DIRECTORY = 'Projects';
const BRIEF_FILENAME = 'brief.md';

function slugifyProjectTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function renderProjectBrief(project: Project): string {
  const sections = [
    `# ${project.title}`,
    '',
    project.summary,
    '',
    '## Goals',
    '',
    ...renderBulletList(project.goals),
    '',
    '## Desired outcomes',
    '',
    ...renderBulletList(project.desiredOutcomes),
  ];

  return `${sections.join('\n').trim()}\n`;
}

function renderBulletList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ['- None yet'];
}

function getProjectDirectory(slug: string): string {
  return resolveDataPath(path.join(PROJECTS_DIRECTORY, slug));
}

function getProjectBriefPath(slug: string): string {
  return resolveDataPath(path.join(PROJECTS_DIRECTORY, slug, BRIEF_FILENAME));
}

async function projectExists(slug: string): Promise<boolean> {
  try {
    await access(getProjectBriefPath(slug));
    return true;
  } catch {
    return false;
  }
}

function frontmatterToProject(slug: string, frontmatter: Record<string, unknown>): Project {
  return projectSchema.parse({
    slug,
    title: frontmatter.title,
    status: frontmatter.status,
    summary: frontmatter.summary,
    goals: Array.isArray(frontmatter.goals) ? frontmatter.goals : [],
    desiredOutcomes: Array.isArray(frontmatter.desiredOutcomes) ? frontmatter.desiredOutcomes : [],
    constraints: Array.isArray(frontmatter.constraints) ? frontmatter.constraints : [],
    nextActions: Array.isArray(frontmatter.nextActions) ? frontmatter.nextActions : [],
    participants: Array.isArray(frontmatter.participants) ? frontmatter.participants : [],
    sourceIds: Array.isArray(frontmatter.sourceIds) ? frontmatter.sourceIds : [],
    artifactIds: Array.isArray(frontmatter.artifactIds) ? frontmatter.artifactIds : [],
    sessionIds: Array.isArray(frontmatter.sessionIds) ? frontmatter.sessionIds : [],
    emailThreadIds: Array.isArray(frontmatter.emailThreadIds) ? frontmatter.emailThreadIds : [],
    calendarEventIds: Array.isArray(frontmatter.calendarEventIds) ? frontmatter.calendarEventIds : [],
    createdAt: frontmatter.createdAt,
    updatedAt: frontmatter.updatedAt,
  });
}

async function writeProjectBrief(project: Project): Promise<void> {
  const projectDirectory = getProjectDirectory(project.slug);
  const briefPath = getProjectBriefPath(project.slug);

  await mkdir(projectDirectory, { recursive: true });
  await writeFile(
    briefPath,
    stringifyMarkdownFile(
      {
        slug: project.slug,
        title: project.title,
        status: project.status,
        summary: project.summary,
        goals: project.goals,
        desiredOutcomes: project.desiredOutcomes,
        constraints: project.constraints,
        nextActions: project.nextActions,
        participants: project.participants,
        sourceIds: project.sourceIds,
        artifactIds: project.artifactIds,
        sessionIds: project.sessionIds,
        emailThreadIds: project.emailThreadIds,
        calendarEventIds: project.calendarEventIds,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      renderProjectBrief(project),
    ),
    'utf8',
  );
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const parsedInput = projectCreateSchema.parse(input);
  const now = new Date().toISOString();
  const slug = slugifyProjectTitle(parsedInput.title);

  if (slug.length === 0) {
    throw new Error('Project title must produce a non-empty slug.');
  }

  if (await projectExists(slug)) {
    throw new Error(`Project with slug "${slug}" already exists.`);
  }

  const project: Project = {
    slug,
    title: parsedInput.title,
    status: parsedInput.status ?? 'draft',
    summary: parsedInput.summary,
    goals: parsedInput.goals,
    desiredOutcomes: parsedInput.desiredOutcomes,
    constraints: [],
    nextActions: [],
    participants: [],
    sourceIds: [],
    artifactIds: [],
    sessionIds: [],
    emailThreadIds: [],
    calendarEventIds: [],
    createdAt: now,
    updatedAt: now,
  };

  await writeProjectBrief(project);

  return project;
}

export async function listProjects(): Promise<Project[]> {
  const projectsDirectory = resolveDataPath(PROJECTS_DIRECTORY);

  await mkdir(projectsDirectory, { recursive: true });

  const entries = await readdir(projectsDirectory, { withFileTypes: true });
  const projects = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => getProject(entry.name)),
  );

  return projects.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getProject(slug: string): Promise<Project> {
  const briefPath = getProjectBriefPath(slug);
  const content = await readFile(briefPath, 'utf8');
  const { frontmatter } = parseMarkdownFile(content);

  return frontmatterToProject(slug, frontmatter);
}

export async function updateProject(slug: string, input: UpdateProjectInput): Promise<Project> {
  const parsedInput = projectUpdateSchema.parse(input);
  const existingProject = await getProject(slug);
  const nextProject: Project = {
    ...existingProject,
    ...parsedInput,
    updatedAt: new Date().toISOString(),
  };

  await writeProjectBrief(nextProject);

  return nextProject;
}
