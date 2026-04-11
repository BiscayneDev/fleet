import { notFound } from 'next/navigation';

import { ArtifactList } from '@/components/artifacts/artifact-list';
import { ProjectTabs } from '@/components/projects/project-tabs';
import { getProject } from '@/lib/fs/project-store';

interface ProjectArtifactsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectArtifactsPage({ params }: ProjectArtifactsPageProps) {
  const { slug } = await params;

  try {
    const project = await getProject(slug);
    const artifacts = project.artifactIds.map((artifactId) => ({
      id: artifactId,
      title: artifactId,
      type: 'artifact',
      detail: 'Artifact metadata will be expanded in a later task.',
    }));

    return (
      <section className="fleet-stack">
        <header className="fleet-panel fleet-stack">
          <p className="fleet-eyebrow">Project deliverables</p>
          <h1>Artifacts</h1>
          <p className="fleet-muted">Outputs connected to {project.title}.</p>
          <ProjectTabs slug={project.slug} />
        </header>

        <article className="fleet-panel fleet-stack">
          <h2>Saved artifacts</h2>
          <ArtifactList artifacts={artifacts} />
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
