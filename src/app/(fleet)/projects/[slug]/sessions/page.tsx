import { notFound } from 'next/navigation';

import { ProjectTabs } from '@/components/projects/project-tabs';
import { SessionList } from '@/components/sessions/session-list';
import { getProject } from '@/lib/fs/project-store';

interface ProjectSessionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectSessionsPage({ params }: ProjectSessionsPageProps) {
  const { slug } = await params;

  try {
    const project = await getProject(slug);
    const sessions = project.sessionIds.map((sessionId, index) => ({
      id: sessionId,
      title: `Session ${index + 1}`,
      detail: sessionId,
    }));

    return (
      <section className="fleet-stack">
        <header className="fleet-panel fleet-stack">
          <p className="fleet-eyebrow">Project history</p>
          <h1>Sessions</h1>
          <p className="fleet-muted">Conversation and work sessions for {project.title}.</p>
          <ProjectTabs slug={project.slug} />
        </header>

        <article className="fleet-panel fleet-stack">
          <h2>Captured sessions</h2>
          <SessionList sessions={sessions} />
        </article>
      </section>
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      notFound();
    }

    throw error;
  }
}
