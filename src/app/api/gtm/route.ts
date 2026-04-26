import { listArtifacts } from '@/lib/fs/artifact-store';
import { gtmSteps } from '@/lib/gtm/steps';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('projectSlug');

  if (!projectSlug) {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  const artifacts = await listArtifacts(projectSlug);

  const steps = gtmSteps.map((step) => {
    const artifact = artifacts.find((a) => a.type === step.artifactType);
    return {
      key: step.key,
      number: step.number,
      title: step.title,
      subtitle: step.subtitle,
      artifactType: step.artifactType,
      dependsOn: step.dependsOn,
      status: artifact ? 'complete' as const : 'pending' as const,
      artifact: artifact
        ? { slug: artifact.slug, title: artifact.title, createdAt: artifact.createdAt }
        : null,
    };
  });

  const completed = steps.filter((s) => s.status === 'complete').length;

  return Response.json({
    steps,
    progress: { completed, total: steps.length },
  });
}
