import { describe, expect, it } from 'vitest';

import { deriveHomeBriefing } from '../../src/lib/fleet/home';
import type { Project } from '../../src/lib/fleet/types';

function makeProject(overrides: Partial<Project>): Project {
  const now = '2026-04-11T15:00:00.000Z';

  return {
    slug: 'project',
    title: 'Project',
    status: 'draft',
    summary: 'Summary',
    goals: [],
    desiredOutcomes: [],
    constraints: [],
    nextActions: [],
    participants: [],
    sourceIds: [],
    artifactIds: [],
    sessionIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('deriveHomeBriefing', () => {
  it('shows only active projects in the active projects section, ordered by freshness', () => {
    const briefing = deriveHomeBriefing([
      makeProject({
        slug: 'paused-project',
        title: 'Paused project',
        status: 'paused',
        updatedAt: '2026-04-11T10:00:00.000Z',
      }),
      makeProject({
        slug: 'active-project',
        title: 'Active project',
        status: 'active',
        updatedAt: '2026-04-11T09:00:00.000Z',
      }),
      makeProject({
        slug: 'draft-project',
        title: 'Draft project',
        status: 'draft',
        updatedAt: '2026-04-11T12:00:00.000Z',
      }),
      makeProject({
        slug: 'newer-active-project',
        title: 'Newer active project',
        status: 'active',
        updatedAt: '2026-04-11T11:00:00.000Z',
      }),
    ]);

    expect(briefing.activeProjects.map((project) => project.slug)).toEqual([
      'newer-active-project',
      'active-project',
    ]);
    expect(briefing.attentionItems[0]?.title).toContain('Paused project');
  });

  it('includes stable project slugs for agent activity and recent knowledge items', () => {
    const briefing = deriveHomeBriefing([
      makeProject({
        slug: 'alpha',
        title: 'Shared title',
        status: 'active',
        summary: 'Same summary',
        sessionIds: ['session-1'],
        updatedAt: '2026-04-11T10:00:00.000Z',
      }),
      makeProject({
        slug: 'beta',
        title: 'Shared title',
        status: 'draft',
        summary: 'Same summary',
        updatedAt: '2026-04-11T11:00:00.000Z',
      }),
    ]);

    expect(briefing.agentActivity).toEqual([
      expect.objectContaining({ slug: 'alpha', projectTitle: 'Shared title' }),
    ]);
    expect(briefing.recentKnowledge.map((item) => item.slug)).toEqual(['beta', 'alpha']);
  });
});
