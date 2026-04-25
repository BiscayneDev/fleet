import { describe, expect, it } from 'vitest';

import { projectSchema, sourceSchema } from '../../src/lib/fleet/schemas';

const validProject = {
  slug: 'alpha-launch',
  title: 'Alpha Launch',
  status: 'active',
  summary: 'Coordinate the alpha launch plan.',
  goals: ['Finalize launch checklist', 'Align stakeholders'],
  desiredOutcomes: ['Launch with aligned stakeholders'],
  constraints: ['Budget capped', 'Two-week timeline'],
  nextActions: ['Draft launch brief', 'Book review meeting'],
  participants: ['halsey', 'ops'],
  sourceIds: ['src_1'],
  artifactIds: ['art_1'],
  sessionIds: ['sess_1'],
  emailThreadIds: ['thread_1'],
  calendarEventIds: ['event_1'],
  createdAt: '2026-04-11T00:00:00.000Z',
  updatedAt: '2026-04-11T01:00:00.000Z',
};

const validSource = {
  type: 'email',
  title: 'Inbox note',
  body: 'Important details',
  origin: 'gmail',
  projectSlugs: ['alpha-launch'],
  ingestionStatus: 'processed',
  createdAt: '2026-04-11T00:00:00.000Z',
  updatedAt: '2026-04-11T01:00:00.000Z',
};

describe('projectSchema', () => {
  it('parses a valid project', () => {
    expect(projectSchema.parse(validProject)).toEqual(validProject);
  });

  it('rejects unknown fields and invalid status values', () => {
    const extraFieldResult = projectSchema.safeParse({
      ...validProject,
      owner: 'halsey',
    });

    const invalidStatusResult = projectSchema.safeParse({
      ...validProject,
      status: 'archived',
    });

    expect(extraFieldResult.success).toBe(false);
    expect(invalidStatusResult.success).toBe(false);
  });
});

describe('sourceSchema', () => {
  it('allows a missing optional id', () => {
    expect(sourceSchema.parse(validSource)).toEqual(validSource);
  });

  it('rejects invalid enum and datetime values', () => {
    const invalidTypeResult = sourceSchema.safeParse({
      ...validSource,
      type: 'message',
    });

    const invalidDateResult = sourceSchema.safeParse({
      ...validSource,
      createdAt: '2026-04-11',
    });

    expect(invalidTypeResult.success).toBe(false);
    expect(invalidDateResult.success).toBe(false);
  });

  it('rejects unknown fields', () => {
    const result = sourceSchema.safeParse({
      ...validSource,
      extra: true,
    });

    expect(result.success).toBe(false);
  });
});
