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
  'competitive-analysis',
  'positioning',
  'icp-profile',
  'channel-strategy',
  'launch-plan',
  'messaging',
  'pricing-analysis',
  'action-plan',
  'network-analysis',
  'brief',
  'memo',
  'report',
] as const;

export const connectionPlatforms = ['twitter', 'linkedin'] as const;

export type ConnectionPlatform = (typeof connectionPlatforms)[number];

export type ArtifactType = (typeof artifactTypes)[number];

export interface Project {
  slug: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  goals: string[];
  desiredOutcomes: string[];
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

export interface Artifact {
  slug: string;
  title: string;
  type: ArtifactType;
  body: string;
  sourcePageSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  platform: ConnectionPlatform;
  handle: string;
  displayName: string;
  company: string | null;
  position: string | null;
  bio: string | null;
  email: string | null;
  tags: string[];
  relevanceNotes: string | null;
  projectSlugs: string[];
  importedAt: string;
  updatedAt: string;
}

export interface NetworkImportMeta {
  id: string;
  platform: ConnectionPlatform;
  filename: string;
  connectionCount: number;
  newCount: number;
  updatedCount: number;
  importedAt: string;
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
