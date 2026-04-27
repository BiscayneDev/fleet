import { z } from 'zod';

import { artifactTypes, connectionPlatforms, projectStatuses, sourceTypes, wikiPageTypes } from './types';

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

export const artifactSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    type: artifactTypeSchema,
    body: z.string(),
    sourcePageSlugs: z.array(z.string()).default([]),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const connectionPlatformSchema = z.enum(connectionPlatforms);

export const connectionSchema = z
  .object({
    id: z.string().min(1),
    platform: connectionPlatformSchema,
    handle: z.string().min(1),
    displayName: z.string().min(1),
    company: z.string().nullable().default(null),
    position: z.string().nullable().default(null),
    bio: z.string().nullable().default(null),
    email: z.string().nullable().default(null),
    tags: z.array(z.string()).default([]),
    relevanceNotes: z.string().nullable().default(null),
    projectSlugs: z.array(z.string()).default([]),
    importedAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const networkImportMetaSchema = z
  .object({
    id: z.string().min(1),
    platform: connectionPlatformSchema,
    filename: z.string(),
    connectionCount: z.number().int().min(0),
    newCount: z.number().int().min(0),
    updatedCount: z.number().int().min(0),
    importedAt: isoDateTimeSchema,
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
