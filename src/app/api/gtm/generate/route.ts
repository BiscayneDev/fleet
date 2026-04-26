import { getProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts, writeArtifact } from '@/lib/fs/artifact-store';
import { listConnections } from '@/lib/fs/network-store';
import { gtmSteps, getStepByKey } from '@/lib/gtm/steps';
import { generateGtmStep } from '@/lib/gtm/generate';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectSlug, stepKey } = body;

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  const step = getStepByKey(stepKey);
  if (!step) {
    return Response.json({ error: `Unknown step: ${stepKey}` }, { status: 400 });
  }

  let project;
  try {
    project = await getProject(projectSlug);
  } catch {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const [wikiPages, allArtifacts, connections] = await Promise.all([
    listWikiPages(projectSlug),
    listArtifacts(projectSlug),
    listConnections(),
  ]);

  // Collect artifacts from dependency steps only
  const depArtifactTypes = step.dependsOn
    .map((key) => gtmSteps.find((s) => s.key === key))
    .filter(Boolean)
    .map((s) => s!.artifactType);

  const priorArtifacts = allArtifacts.filter((a) =>
    depArtifactTypes.includes(a.type),
  );

  try {
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

    return Response.json({ artifact, stepKey: step.key });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
