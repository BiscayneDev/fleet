import type { Project } from '@/lib/fleet/types';

import { ProjectBriefCard } from './project-brief-card';

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="fleet-panel">
        <h2>No projects yet</h2>
        <p className="fleet-muted">Create a project brief to start filling out the Fleet workspace.</p>
      </div>
    );
  }

  return (
    <div className="fleet-stack">
      {projects.map((project) => (
        <ProjectBriefCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
