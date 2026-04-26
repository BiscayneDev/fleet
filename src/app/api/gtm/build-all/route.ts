import { getProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts, writeArtifact } from '@/lib/fs/artifact-store';
import { listConnections } from '@/lib/fs/network-store';
import { gtmSteps } from '@/lib/gtm/steps';
import { generateGtmStep } from '@/lib/gtm/generate';

export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json();
  const { projectSlug } = body;

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  let project;
  try {
    project = await getProject(projectSlug);
  } catch {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const [wikiPages, connections] = await Promise.all([
    listWikiPages(projectSlug),
    listConnections(),
  ]);

  const results: Array<{ stepKey: string; artifactSlug: string }> = [];
  const errors: Array<{ stepKey: string; error: string }> = [];

  // Run steps sequentially — each step depends on prior artifacts
  for (const step of gtmSteps) {
    try {
      // Reload artifacts to include freshly generated ones from prior steps
      const currentArtifacts = await listArtifacts(projectSlug);

      // Get artifacts from dependency steps
      const depArtifactTypes = step.dependsOn
        .map((key) => gtmSteps.find((s) => s.key === key))
        .filter(Boolean)
        .map((s) => s!.artifactType);

      const priorArtifacts = currentArtifacts.filter((a) =>
        depArtifactTypes.includes(a.type),
      );

      const content = await generateGtmStep(
        step,
        project,
        wikiPages,
        priorArtifacts,
        connections,
      );

      const artifact = await writeArtifact(projectSlug, {
        title: `${step.title} — ${project.title}`,
        type: step.artifactType,
        body: content,
      });

      results.push({ stepKey: step.key, artifactSlug: artifact.slug });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      errors.push({ stepKey: step.key, error: message });
    }
  }

  return Response.json({
    completed: results.length,
    total: gtmSteps.length,
    results,
    errors,
  });
}
