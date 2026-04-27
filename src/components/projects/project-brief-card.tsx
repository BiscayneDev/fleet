import Link from 'next/link';

import type { Project } from '@/lib/fleet/types';

const projectDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});

function formatUpdatedAt(updatedAt: string): string {
  const date = new Date(updatedAt);

  return Number.isNaN(date.valueOf()) ? updatedAt : projectDateFormatter.format(date);
}

const STATUS_BADGE: Record<string, string> = {
  active: 'fleet-badge fleet-badge-active',
  draft: 'fleet-badge fleet-badge-draft',
  paused: 'fleet-badge fleet-badge-paused',
  complete: 'fleet-badge fleet-badge-complete',
  archived: 'fleet-badge fleet-badge-paused',
};

export function ProjectBriefCard({ project }: { project: Project }) {
  const badgeClass = STATUS_BADGE[project.status] ?? 'fleet-badge fleet-badge-draft';

  return (
    <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="fleet-panel fleet-panel-interactive fleet-stack">
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p className="fleet-eyebrow">Project</p>
            <h2 style={{ margin: 0 }}>{project.title}</h2>
          </div>
          <span className={badgeClass}>
            {project.status === 'active' && <span className="fleet-badge-dot" />}
            {project.status}
          </span>
        </div>

        <p className="fleet-body" style={{ color: 'var(--fleet-text-muted)', margin: 0 }}>{project.summary}</p>

        <dl
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            margin: 0,
          }}
        >
          <div>
            <dt className="fleet-eyebrow">Goals</dt>
            <dd style={{ margin: 0 }}>{project.goals.length}</dd>
          </div>
          <div>
            <dt className="fleet-eyebrow">Outcomes</dt>
            <dd style={{ margin: 0 }}>{project.desiredOutcomes.length}</dd>
          </div>
          <div>
            <dt className="fleet-eyebrow">Sources</dt>
            <dd style={{ margin: 0 }}>{project.sourceIds.length}</dd>
          </div>
          <div>
            <dt className="fleet-eyebrow">Updated</dt>
            <dd style={{ margin: 0 }}>{formatUpdatedAt(project.updatedAt)}</dd>
          </div>
        </dl>
      </article>
    </Link>
  );
}
