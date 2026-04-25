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

export function ProjectBriefCard({ project }: { project: Project }) {
  return (
    <article className="fleet-panel fleet-stack">
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
          <h2 style={{ margin: 0 }}>
            <Link href={`/projects/${project.slug}`}>{project.title}</Link>
          </h2>
        </div>
        <span
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '999px',
            color: 'var(--fleet-text)',
            fontSize: '0.875rem',
            padding: '0.35rem 0.7rem',
            textTransform: 'capitalize',
          }}
        >
          {project.status}
        </span>
      </div>

      <p>{project.summary}</p>

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
  );
}
