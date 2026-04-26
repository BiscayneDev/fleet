import { listArtifacts } from '@/lib/fs/artifact-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listConnections } from '@/lib/fs/network-store';
import { gtmSteps } from '@/lib/gtm/steps';
import { GtmBuilder } from '@/components/gtm/gtm-builder';
import { getProjectOrNotFound, type ProjectRouteProps } from '../project-page';

export default async function GtmBuilderPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const [artifacts, wikiPages, connections] = await Promise.all([
    listArtifacts(slug),
    listWikiPages(slug),
    listConnections(),
  ]);

  const steps = gtmSteps.map((step) => {
    const artifact = artifacts.find((a) => a.type === step.artifactType);
    const depsComplete = step.dependsOn.every((depKey) => {
      const depStep = gtmSteps.find((s) => s.key === depKey);
      return depStep && artifacts.some((a) => a.type === depStep.artifactType);
    });

    return {
      ...step,
      status: artifact ? 'complete' as const : 'pending' as const,
      ready: step.dependsOn.length === 0 || depsComplete,
      artifact: artifact
        ? { slug: artifact.slug, title: artifact.title, body: artifact.body, createdAt: artifact.createdAt }
        : null,
    };
  });

  const completed = steps.filter((s) => s.status === 'complete').length;

  return (
    <div className="gtm-builder">
      <GtmBuilder
        projectSlug={slug}
        projectTitle={project.title}
        steps={steps}
        completed={completed}
        total={steps.length}
        sourceCount={wikiPages.length}
        connectionCount={connections.length}
      />
    </div>
  );
}
