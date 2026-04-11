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
