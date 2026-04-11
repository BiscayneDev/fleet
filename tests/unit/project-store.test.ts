import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { parseMarkdownFile } from '../../src/lib/fs/frontmatter';
import { createProject } from '../../src/lib/fs/project-store';

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

describe('createProject', () => {
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
});
