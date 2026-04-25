import type { Project } from './types';

export interface HomeAttentionItem {
  slug: string;
  title: string;
  detail: string;
}

export interface HomeKnowledgeItem {
  slug: string;
  projectTitle: string;
  detail: string;
}

export interface HomeAgentActivityItem {
  slug: string;
  projectTitle: string;
  detail: string;
}

export interface HomeBriefing {
  attentionItems: HomeAttentionItem[];
  activeProjects: Project[];
  agentActivity: HomeAgentActivityItem[];
  recentKnowledge: HomeKnowledgeItem[];
}

const activeStatusRank: Record<Project['status'], number> = {
  active: 0,
  draft: 1,
  paused: 2,
  done: 3,
};

const attentionStatusRank: Record<Project['status'], number> = {
  paused: 0,
  active: 1,
  draft: 2,
  done: 3,
};

function compareByUpdatedAtDesc(left: Project, right: Project): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function compareHomeProjectPriority(left: Project, right: Project): number {
  const statusRankDelta = activeStatusRank[left.status] - activeStatusRank[right.status];

  return statusRankDelta !== 0 ? statusRankDelta : compareByUpdatedAtDesc(left, right);
}

function summarizeAttention(project: Project): string | null {
  if (project.status === 'paused') {
    return 'Paused — needs restart or closure decision.';
  }

  if (project.status === 'active' && project.nextActions.length === 0) {
    return 'Active but no next action recorded.';
  }

  if (project.status === 'draft' && project.goals.length === 0) {
    return 'Draft with no goals — needs direction.';
  }

  // Projects with no research yet
  if (project.status === 'active' && project.sourceIds.length === 0) {
    return 'Active but no research captured yet.';
  }

  return null;
}

function summarizeKnowledge(project: Project): string {
  if (project.desiredOutcomes[0]) {
    return project.desiredOutcomes[0];
  }

  if (project.goals[0]) {
    return project.goals[0];
  }

  return project.summary;
}

function summarizeAgentActivity(project: Project): string {
  if (project.sessionIds.length > 0) {
    return `${project.sessionIds.length} recent agent session${project.sessionIds.length === 1 ? '' : 's'} linked.`;
  }

  if (project.artifactIds.length > 0) {
    return `${project.artifactIds.length} artifact${project.artifactIds.length === 1 ? '' : 's'} prepared for follow-through.`;
  }

  return 'No recent agent activity recorded yet.';
}

export function deriveHomeBriefing(projects: Project[]): HomeBriefing {
  const prioritizedProjects = [...projects].sort(compareHomeProjectPriority);

  return {
    attentionItems: [...prioritizedProjects]
      .sort((left, right) => {
        const statusRankDelta = attentionStatusRank[left.status] - attentionStatusRank[right.status];

        return statusRankDelta !== 0 ? statusRankDelta : compareByUpdatedAtDesc(left, right);
      })
      .map((project) => {
        const detail = summarizeAttention(project);

        if (!detail) {
          return null;
        }

        return {
          slug: project.slug,
          title: project.title,
          detail,
        } satisfies HomeAttentionItem;
      })
      .filter((item): item is HomeAttentionItem => item !== null)
      .slice(0, 3),
    activeProjects: prioritizedProjects.filter((project) => project.status === 'active').slice(0, 3),
    agentActivity: prioritizedProjects
      .filter((project) => project.status === 'active' || project.sessionIds.length > 0 || project.artifactIds.length > 0)
      .sort(compareByUpdatedAtDesc)
      .slice(0, 3)
      .map((project) => ({
        slug: project.slug,
        projectTitle: project.title,
        detail: summarizeAgentActivity(project),
      })),
    recentKnowledge: [...projects]
      .sort(compareByUpdatedAtDesc)
      .slice(0, 3)
      .map((project) => ({
        slug: project.slug,
        projectTitle: project.title,
        detail: summarizeKnowledge(project),
      })),
  };
}
