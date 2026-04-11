import { SessionList } from '@/components/sessions/session-list';

import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function ProjectSessionsPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const sessions = project.sessionIds.map((sessionId, index) => ({
    id: sessionId,
    title: `Session ${index + 1}`,
    detail: sessionId,
  }));

  return (
    <article className="fleet-panel fleet-stack">
      <h2>Captured sessions</h2>
      <p style={{ color: 'var(--fleet-text-muted)' }}>Conversation and work sessions for {project.title}.</p>
      <SessionList sessions={sessions} />
    </article>
  );
}
