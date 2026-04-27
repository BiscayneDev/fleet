import type { ReactNode } from 'react';

import { ProjectTabs } from '@/components/projects/project-tabs';
import { ProjectActions } from '@/components/projects/project-actions';

import { getProjectOrNotFound, type ProjectRouteProps } from './project-page';

export default async function ProjectLayout({
  children,
  params,
}: ProjectRouteProps & { children: ReactNode }) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);

  return (
    <section className="fleet-stack">
      <header className="project-header">
        <div className="project-header-top">
          <div>
            <h1 className="project-header-title">{project.title}</h1>
            <p className="project-header-summary">{project.summary}</p>
          </div>
          <ProjectActions slug={project.slug} currentStatus={project.status} />
        </div>
        <ProjectTabs slug={project.slug} />
      </header>

      {children}
    </section>
  );
}
