import { ProjectList } from '@/components/projects/project-list';
import { CreateProjectButton } from '@/components/projects/create-project-button';
import { listProjects } from '@/lib/fs/project-store';

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <section className="fleet-stack">
      <header className="fleet-panel fleet-stack">
        <p className="fleet-eyebrow">Projects</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1>Projects</h1>
            <p style={{ color: 'var(--fleet-text-muted)' }}>
              Browse project briefs and open a workspace for sources, wiki context, artifacts, and sessions.
            </p>
          </div>
          <CreateProjectButton />
        </div>
      </header>

      <ProjectList projects={projects} />
    </section>
  );
}
