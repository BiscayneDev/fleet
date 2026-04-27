import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { createProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts, writeArtifact } from '@/lib/fs/artifact-store';
import { listConnections } from '@/lib/fs/network-store';
import { runAutoresearch } from '@/lib/autoresearch/orchestrator';
import { generateGtmStep } from '@/lib/gtm/generate';
import { gtmSteps } from '@/lib/gtm/steps';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(payload));
}

export async function POST(request: Request) {
  const { idea } = await request.json();

  if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
    return Response.json({ error: 'Please provide a startup idea (at least 5 characters)' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: Parse idea → generate title + goals
        sendEvent(controller, 'phase', { phase: 'parsing', status: 'running' });

        const { provider, model } = resolveProvider();
        const parseResult = await generateText({
          model: provider.languageModel(model),
          system: 'Return ONLY valid JSON. No markdown, no explanation.',
          prompt: `Given this startup idea, generate a project name and 3 goals. Return JSON:
{"title": "Short Product Name (2-4 words)", "summary": "${idea.trim()}", "goals": ["goal 1", "goal 2", "goal 3"]}

Idea: "${idea.trim()}"`,
          temperature: 0.4,
          maxOutputTokens: 256,
        });

        let title = idea.trim().split(' ').slice(0, 4).join(' ');
        let goals: string[] = [];

        try {
          const cleaned = parseResult.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          title = parsed.title ?? title;
          goals = Array.isArray(parsed.goals) ? parsed.goals : [];
        } catch {
          // Use defaults
        }

        // Phase 2: Create project
        sendEvent(controller, 'phase', { phase: 'project', status: 'running', title });

        const project = await createProject({
          title,
          summary: idea.trim(),
          goals,
          desiredOutcomes: [],
        });

        sendEvent(controller, 'phase', { phase: 'project', status: 'done', title: project.title, slug: project.slug });

        // Phase 3: Auto-research (discover competitors)
        sendEvent(controller, 'phase', { phase: 'research', status: 'running' });

        let researchResult;
        try {
          researchResult = await runAutoresearch(project.slug);
          sendEvent(controller, 'phase', {
            phase: 'research',
            status: 'done',
            sources: researchResult.wikiPagesCreated,
            queries: researchResult.queriesUsed.length,
          });
        } catch (error) {
          sendEvent(controller, 'phase', {
            phase: 'research',
            status: 'skipped',
            reason: error instanceof Error ? error.message : 'Research unavailable',
          });
        }

        // Phase 4: Generate GTM steps (sequential, streaming progress)
        const connections = await listConnections();
        let completedSteps = 0;

        for (const step of gtmSteps) {
          sendEvent(controller, 'phase', {
            phase: 'gtm',
            step: step.number,
            total: gtmSteps.length,
            title: step.title,
            status: 'running',
          });

          try {
            // Load current wiki pages and artifacts (including from prior steps)
            const [wikiPages, artifacts] = await Promise.all([
              listWikiPages(project.slug),
              listArtifacts(project.slug),
            ]);

            // Get prior artifacts this step depends on
            const priorArtifacts = artifacts.filter((a) =>
              step.dependsOn.some((dep) => {
                const depStep = gtmSteps.find((s) => s.key === dep);
                return depStep && a.type === depStep.artifactType;
              })
            );

            const body = await generateGtmStep(step, project, wikiPages, priorArtifacts, connections);

            await writeArtifact(project.slug, {
              title: step.title,
              type: step.artifactType,
              body,
              sourcePageSlugs: wikiPages.map((p) => p.slug),
            });

            completedSteps++;

            sendEvent(controller, 'phase', {
              phase: 'gtm',
              step: step.number,
              total: gtmSteps.length,
              title: step.title,
              status: 'done',
            });
          } catch (error) {
            sendEvent(controller, 'phase', {
              phase: 'gtm',
              step: step.number,
              total: gtmSteps.length,
              title: step.title,
              status: 'error',
              reason: error instanceof Error ? error.message : 'Generation failed',
            });
          }
        }

        // Phase 5: Complete
        sendEvent(controller, 'phase', {
          phase: 'complete',
          projectSlug: project.slug,
          artifacts: completedSteps,
          title: project.title,
        });
      } catch (error) {
        sendEvent(controller, 'error', {
          message: error instanceof Error ? error.message : 'Quick start failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
