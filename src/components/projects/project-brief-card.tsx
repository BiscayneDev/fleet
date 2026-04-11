import Link from 'next/link';

import type { Project } from '@/lib/fleet/types';

export function ProjectBriefCard({ project }: { project: Project }) {
  return (
    <article className="fleet-panel fleet-stack">
      <div className="fleet-row fleet-row-between fleet-row-start">
        <div>
          <p className="fleet-eyebrow">Project</p>
          <h2 className="fleet-heading-reset">
            <Link href={`/projects/${project.slug}`}>{project.title}</Link>
          </h2>
        </div>
        <span className="fleet-badge">{project.status}</span>
      </div>

      <p>{project.summary}</p>

      <dl className="fleet-metadata-grid">
        <div>
          <dt className="fleet-eyebrow">Goals</dt>
          <dd>{project.goals.length}</dd>
        </div>
        <div>
          <dt className="fleet-eyebrow">Outcomes</dt>
          <dd>{project.desiredOutcomes.length}</dd>
        </div>
        <div>
          <dt className="fleet-eyebrow">Sources</dt>
          <dd>{project.sourceIds.length}</dd>
        </div>
        <div>
          <dt className="fleet-eyebrow">Updated</dt>
          <dd>{new Date(project.updatedAt).toLocaleDateString()}</dd>
        </div>
      </dl>
    </article>
  );
}
