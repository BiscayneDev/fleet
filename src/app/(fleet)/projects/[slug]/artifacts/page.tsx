import { ArtifactList } from '@/components/artifacts/artifact-list';

import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function ProjectArtifactsPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const artifacts = project.artifactIds.map((artifactId) => ({
    id: artifactId,
    title: artifactId,
    type: 'artifact',
    detail: 'Artifact metadata will be expanded in a later task.',
  }));

  return (
    <article className="fleet-panel fleet-stack">
      <h2>Saved artifacts</h2>
      <p style={{ color: 'var(--fleet-text-muted)' }}>Outputs connected to {project.title}.</p>
      <ArtifactList artifacts={artifacts} />
    </article>
  );
}
