import { ProjectList } from '@/components/projects/project-list';
import { listProjects } from '@/lib/fs/project-store';

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <section className="fleet-stack">
      <header className="fleet-panel fleet-stack">
        <p className="fleet-eyebrow">Projects</p>
        <h1>Projects</h1>
        <p style={{ color: 'var(--fleet-text-muted)' }}>
          Browse project briefs and open a workspace for sources, wiki context, artifacts, and sessions.
        </p>
      </header>

      <ProjectList projects={projects} />
    </section>
  );
}
