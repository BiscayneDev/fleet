import { Folder } from 'lucide-react';

import { ProjectList } from '@/components/projects/project-list';
import { CreateProjectWizard } from '@/components/projects/create-project-wizard';
import { EmptyState } from '@/components/empty-state/empty-state';
import { listProjects } from '@/lib/fs/project-store';

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Projects
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Browse project briefs and open a workspace for sources, wiki
            context, artifacts, and sessions.
          </p>
        </div>
        <CreateProjectWizard />
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No projects yet"
          description="A project bundles your research, wiki, contacts, and GTM artifacts in one workspace. Create your first to start filling it out."
        />
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}
