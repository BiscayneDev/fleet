import type { ReactNode } from 'react';

import { ProjectTabs } from '@/components/projects/project-tabs';

import { getProjectOrNotFound, type ProjectRouteProps } from './project-page';

export default async function ProjectLayout({
  children,
  params,
}: ProjectRouteProps & { children: ReactNode }) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);

  return (
    <section className="fleet-stack">
      <header className="fleet-panel fleet-stack">
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p className="fleet-eyebrow">Project workspace</p>
            <h1 style={{ margin: 0 }}>{project.title}</h1>
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
        <ProjectTabs slug={project.slug} />
      </header>

      {children}
    </section>
  );
}