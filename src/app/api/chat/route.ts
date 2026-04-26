import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { getProject } from '@/lib/fs/project-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { listConnections } from '@/lib/fs/network-store';
import { buildProjectSystemPrompt } from '@/lib/llm-wiki/chat-context';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error('LLM_WIKI_API_KEY or NOUS_API_KEY must be set');
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

export async function POST(request: Request) {
  const { messages, projectSlug } = await request.json();

  if (!projectSlug || typeof projectSlug !== 'string') {
    return Response.json({ error: 'projectSlug is required' }, { status: 400 });
  }

  let project;
  try {
    project = await getProject(projectSlug);
  } catch {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const [wikiPages, artifacts, connections] = await Promise.all([
    listWikiPages(projectSlug),
    listArtifacts(projectSlug),
    listConnections(),
  ]);

  const systemPrompt = buildProjectSystemPrompt(project, wikiPages, artifacts, connections);

  const { provider, model } = resolveProvider();

  // Convert UIMessages (from useChat) to ModelMessages (for streamText)
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: provider.languageModel(model),
    system: systemPrompt,
    messages: modelMessages,
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
}
