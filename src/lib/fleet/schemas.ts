import { z } from 'zod';

import { artifactTypes, projectStatuses, sourceTypes, wikiPageTypes } from './types';

export const projectStatusSchema = z.enum(projectStatuses);
export const sourceTypeSchema = z.enum(sourceTypes);
export const wikiPageTypeSchema = z.enum(wikiPageTypes);
export const artifactTypeSchema = z.enum(artifactTypes);

const isoDateTimeSchema = z.iso.datetime();
const stringArraySchema = z.array(z.string());

export const projectSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    status: projectStatusSchema,
    summary: z.string(),
    goals: stringArraySchema,
    desiredOutcomes: stringArraySchema,
    constraints: stringArraySchema,
    nextActions: stringArraySchema,
    participants: stringArraySchema,
    sourceIds: stringArraySchema,
    artifactIds: stringArraySchema,
    sessionIds: stringArraySchema,
    emailThreadIds: stringArraySchema,
    calendarEventIds: stringArraySchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const projectCreateSchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    goals: stringArraySchema,
    desiredOutcomes: stringArraySchema,
    status: projectStatusSchema.optional(),
  })
  .strict();

export const projectUpdateSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1).optional(),
    goals: stringArraySchema.optional(),
    desiredOutcomes: stringArraySchema.optional(),
    status: projectStatusSchema.optional(),
  })
  .strict();

export const sourceSchema = z
  .object({
    id: z.string().optional(),
    type: sourceTypeSchema,
    title: z.string(),
    body: z.string(),
    origin: z.string(),
    projectSlugs: stringArraySchema,
    ingestionStatus: z.string(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();
