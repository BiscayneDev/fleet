import { notFound } from 'next/navigation';

import { ProjectTabs } from '@/components/projects/project-tabs';
import { getProject } from '@/lib/fs/project-store';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  try {
    const project = await getProject(slug);

    return (
      <section className="fleet-stack">
        <header className="fleet-panel fleet-stack">
          <div className="fleet-row fleet-row-between fleet-row-start">
            <div>
              <p className="fleet-eyebrow">Project workspace</p>
              <h1>{project.title}</h1>
            </div>
            <span className="fleet-badge">{project.status}</span>
          </div>

          <p>{project.summary}</p>
          <ProjectTabs slug={project.slug} />
        </header>

        <div className="fleet-grid fleet-grid-2">
          <article className="fleet-panel fleet-stack">
            <h2>Goals</h2>
            <ul className="fleet-bullet-list">
              {(project.goals.length > 0 ? project.goals : ['No goals captured yet.']).map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </article>

          <article className="fleet-panel fleet-stack">
            <h2>Desired outcomes</h2>
            <ul className="fleet-bullet-list">
              {(project.desiredOutcomes.length > 0
                ? project.desiredOutcomes
                : ['No desired outcomes captured yet.']).map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      notFound();
    }

    throw error;
  }
}
