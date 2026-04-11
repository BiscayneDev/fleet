export const projectStatuses = ['draft', 'active', 'paused', 'done'] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const sourceTypes = [
  'link',
  'email',
  'calendar',
  'note',
  'file',
  'pdf',
  'transcript',
] as const;

export type SourceType = (typeof sourceTypes)[number];

export const wikiPageTypes = [
  'source',
  'concept',
  'topic',
  'decision',
  'person',
  'solution',
] as const;

export type WikiPageType = (typeof wikiPageTypes)[number];

export const artifactTypes = [
  'brief',
  'memo',
  'draft',
  'checklist',
  'plan',
  'table',
  'spec',
  'report',
] as const;

export type ArtifactType = (typeof artifactTypes)[number];

export interface Project {
  slug: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  goals: string[];
  constraints: string[];
  nextActions: string[];
  participants: string[];
  sourceIds: string[];
  artifactIds: string[];
  sessionIds: string[];
  emailThreadIds: string[];
  calendarEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id?: string;
  type: SourceType;
  title: string;
  body: string;
  origin: string;
  projectSlugs: string[];
  ingestionStatus: string;
  createdAt: string;
  updatedAt: string;
}
