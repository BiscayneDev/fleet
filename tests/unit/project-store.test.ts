import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { parseMarkdownFile } from '../../src/lib/fs/frontmatter';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '../../src/lib/fs/project-store';

const tempDirs: string[] = [];

async function makeTempDataRoot(): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'fleet-project-store-'));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  delete process.env.FLEET_DATA_ROOT;
  await Promise.all(tempDirs.splice(0).map((tempDir) => rm(tempDir, { force: true, recursive: true })));
});

describe('project store', () => {
  it('creates a slugged project directory with a brief.md file', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    const project = await createProject({
      title: 'Alpha Launch Plan',
      summary: 'Coordinate the alpha launch.',
      goals: ['Align the team'],
      desiredOutcomes: ['A launch-ready plan'],
    });

    const briefPath = path.join(dataRoot, 'Projects', 'alpha-launch-plan', 'brief.md');
    const briefStats = await stat(briefPath);
    const briefContent = await readFile(briefPath, 'utf8');
    const { frontmatter, body } = parseMarkdownFile(briefContent);

    expect(project.slug).toBe('alpha-launch-plan');
    expect(briefStats.isFile()).toBe(true);
    expect(frontmatter.title).toBe('Alpha Launch Plan');
    expect(frontmatter.summary).toBe('Coordinate the alpha launch.');
    expect(frontmatter.goals).toEqual(['Align the team']);
    expect(frontmatter.desiredOutcomes).toEqual(['A launch-ready plan']);
    expect(body).toContain('# Alpha Launch Plan');
    expect(body).toContain('Coordinate the alpha launch.');
  });

  it('lists, reads, and updates project metadata from brief.md frontmatter', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    await createProject({
      title: 'Alpha Launch Plan',
      summary: 'Coordinate the alpha launch.',
      goals: ['Align the team'],
      desiredOutcomes: ['A launch-ready plan'],
    });

    const createdProject = await createProject({
      title: 'Beta Research',
      summary: 'Explore the beta market opportunity.',
      goals: ['Interview prospects'],
      desiredOutcomes: ['Decide whether to invest further'],
      status: 'active',
    });

    const listedProjects = await listProjects();
    const loadedProject = await getProject(createdProject.slug);
    const updatedProject = await updateProject(createdProject.slug, {
      summary: 'Explore the beta market opportunity in more detail.',
      goals: ['Interview prospects', 'Review competitors'],
      desiredOutcomes: ['Recommend a go/no-go decision'],
    });

    expect(listedProjects).toHaveLength(2);
    expect(listedProjects.map((project) => project.slug)).toContain('alpha-launch-plan');
    expect(loadedProject).toMatchObject({
      slug: 'beta-research',
      status: 'active',
      goals: ['Interview prospects'],
      desiredOutcomes: ['Decide whether to invest further'],
    });
    expect(updatedProject.summary).toBe('Explore the beta market opportunity in more detail.');
    expect(updatedProject.goals).toEqual(['Interview prospects', 'Review competitors']);
    expect(updatedProject.desiredOutcomes).toEqual(['Recommend a go/no-go decision']);
    expect(updatedProject.updatedAt >= updatedProject.createdAt).toBe(true);
  });

  it('rejects duplicate project slugs instead of overwriting an existing project', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    await createProject({
      title: 'Alpha Launch Plan',
      summary: 'Coordinate the alpha launch.',
      goals: ['Align the team'],
      desiredOutcomes: ['A launch-ready plan'],
    });

    await expect(
      createProject({
        title: 'Alpha   Launch Plan!!!',
        summary: 'Attempt to overwrite the existing project.',
        goals: ['Overwrite'],
        desiredOutcomes: ['Should be rejected'],
      }),
    ).rejects.toThrow('Project with slug "alpha-launch-plan" already exists.');

    const briefPath = path.join(dataRoot, 'Projects', 'alpha-launch-plan', 'brief.md');
    const briefContent = await readFile(briefPath, 'utf8');
    const { frontmatter } = parseMarkdownFile(briefContent);

    expect(frontmatter.summary).toBe('Coordinate the alpha launch.');
    expect(frontmatter.goals).toEqual(['Align the team']);
  });

  it('rejects titles that produce an empty slug', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    await expect(
      createProject({
        title: '🚀🔥✨',
        summary: 'A title with only emoji should be invalid.',
        goals: ['Avoid invalid paths'],
        desiredOutcomes: ['Reject before writing'],
      }),
    ).rejects.toThrow('Project title must produce a non-empty slug.');

    await expect(stat(path.join(dataRoot, 'Projects', 'brief.md'))).rejects.toThrow();
  });
});
