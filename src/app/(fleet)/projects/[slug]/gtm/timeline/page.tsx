import { listArtifacts } from '@/lib/fs/artifact-store';
import { GtmTimeline } from '@/components/gtm/gtm-timeline';
import { getProjectOrNotFound, type ProjectRouteProps } from '../../project-page';

export default async function GtmTimelinePage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);
  const artifacts = await listArtifacts(slug);

  const launchPlan = artifacts.find((a) => a.type === 'launch-plan');
  const allGtmArtifacts = artifacts.filter((a) =>
    ['icp-profile', 'positioning', 'messaging', 'channel-strategy', 'launch-plan', 'network-analysis', 'brief'].includes(a.type),
  );

  return (
    <div>
      <GtmTimeline
        projectSlug={slug}
        projectTitle={project.title}
        launchPlan={launchPlan ? { title: launchPlan.title, body: launchPlan.body, createdAt: launchPlan.createdAt } : null}
        artifactCount={allGtmArtifacts.length}
      />
    </div>
  );
}
