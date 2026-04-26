import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { Project, Artifact, Connection } from '../fleet/types';
import type { WikiPage } from '../fs/wiki-store';
import type { GtmStepDefinition } from './steps';

function resolveProvider() {
  const apiKey = process.env.LLM_WIKI_API_KEY ?? process.env.NOUS_API_KEY ?? '';
  const baseUrl =
    process.env.LLM_WIKI_BASE_URL ?? 'https://inference-api.nousresearch.com/v1';
  const model = process.env.LLM_WIKI_MODEL ?? 'deepseek-v3';

  if (!apiKey) {
    throw new Error('LLM API key must be set');
  }

  const provider = createOpenAI({ apiKey, baseURL: baseUrl });
  return { provider, model };
}

function buildContext(
  project: Project,
  wikiPages: WikiPage[],
  priorArtifacts: Artifact[],
  connections: Connection[],
): string {
  const sections: string[] = [];

  sections.push(`# Project: ${project.title}`);
  sections.push(`Summary: ${project.summary}`);
  if (project.goals.length > 0) {
    sections.push(`Goals: ${project.goals.join('; ')}`);
  }
  if (project.desiredOutcomes.length > 0) {
    sections.push(`Desired Outcomes: ${project.desiredOutcomes.join('; ')}`);
  }
  sections.push('');

  if (wikiPages.length > 0) {
    sections.push('## Captured Research');
    for (const page of wikiPages.slice(0, 25)) {
      sections.push(`### ${page.title}`);
      if (page.summary) sections.push(page.summary);
      if (page.competitors.length > 0) sections.push(`Competitors: ${page.competitors.join(', ')}`);
      if (page.concepts.length > 0) sections.push(`Concepts: ${page.concepts.join(', ')}`);
      sections.push('');
    }
  }

  if (priorArtifacts.length > 0) {
    sections.push('## Previously Generated GTM Artifacts');
    for (const artifact of priorArtifacts) {
      sections.push(`### ${artifact.title} (${artifact.type})`);
      sections.push(artifact.body);
      sections.push('');
    }
  }

  if (connections.length > 0) {
    sections.push(`## Network (${connections.length} connections)`);
    for (const conn of connections.slice(0, 50)) {
      const parts = [`- ${conn.displayName} (@${conn.handle}, ${conn.platform})`];
      if (conn.company) parts[0] += ` — ${conn.company}`;
      if (conn.position) parts[0] += `, ${conn.position}`;
      sections.push(parts.join(''));
    }
    sections.push('');
  }

  return sections.join('\n');
}

const stepPrompts: Record<string, string> = {
  icp: `Build a detailed Ideal Customer Profile (ICP) for this project.

Include:
- **Primary Persona**: Title, company size, industry, daily responsibilities
- **Pain Points**: 3-5 specific problems they face (not generic)
- **Buying Triggers**: What events make them actively search for a solution
- **Decision Criteria**: What they evaluate when choosing
- **Where They Hang Out**: Online communities, publications, events, social platforms
- **Anti-Personas**: Who is NOT a fit and why

Ground this in the captured research. Reference specific competitors and market signals. Be specific — "Series A SaaS founders" is better than "startup founders."`,

  positioning: `Create a positioning framework for this project.

Include:
- **Positioning Statement**: For [target] who [need], [product] is the [category] that [key benefit]. Unlike [alternatives], we [differentiator].
- **Category**: What market category do you own or create?
- **Competitive Differentiation Matrix**: Compare against top 3-5 competitors on key dimensions
- **Unique Value Proposition**: The one thing only you can claim
- **Strategic Narrative**: The 30-second story of why this product exists now

Reference the ICP and competitive intelligence from captured research. Be opinionated about positioning — generic positioning is worse than no positioning.`,

  messaging: `Create a messaging framework for this project.

Include:
- **Tagline**: One punchy line (under 10 words)
- **Elevator Pitch**: 30-second version
- **Value Propositions**: 3 key pillars, each with headline + supporting point + proof
- **Objection Handling**: Top 5 objections and how to address each
- **Tone & Voice**: How the brand speaks (with examples)
- **Message by Audience Segment**: Adapt the core message for each ICP segment

Build directly on the positioning and ICP. The messaging should flow naturally from the positioning statement.`,

  channels: `Create a channel strategy for reaching the ICP.

Include:
- **Ranked Channel List**: Top 5-7 channels, ordered by expected ROI
- **For each channel**:
  - Why it works for this ICP (specific reasoning)
  - Content format that performs best
  - Estimated effort (low/medium/high)
  - Key metrics to track
  - First action to take
- **Channel Mix**: How channels work together (e.g., Twitter drives awareness, email converts)
- **Channels to AVOID**: And why they're a waste of time for this product

Use the ICP's "where they hang out" data. Reference the founder's network to identify warm channels.`,

  content: `Draft launch content for the top channels.

Include:
- **Product Hunt**: Title, tagline, description (first 3 paragraphs), maker comment
- **Twitter/X Thread**: 5-7 tweet thread announcing the launch
- **Hacker News**: Show HN post title and body
- **Launch Email**: Subject line + body for announcing to your network
- **LinkedIn Post**: Professional announcement post

Each piece should use the messaging framework directly. Maintain consistent voice across all channels. Make these ready to copy-paste — not templates, actual content.`,

  outreach: `Create a personalized outreach plan using the founder's network.

Include:
- **Top 10 Priority Contacts**: From the founder's imported connections, identify the 10 people most valuable for this launch
- **For each contact**:
  - Who they are and why they matter
  - Type: customer prospect / distribution partner / advisor / investor / co-marketing
  - Personalized message draft (2-3 sentences, specific to them)
  - Suggested channel (email, DM, LinkedIn)
  - Priority: reach out this week / next week / after launch
- **Outreach Sequence**: Recommended order and timing
- **Warm Intro Paths**: Who can intro you to people outside your network

Reference actual connection names and companies. Generic outreach is spam — make each message specific.`,

  'launch-plan': `Create a week-by-week launch plan.

Include:
- **Pre-Launch (Week -2 to -1)**:
  - Preparation tasks, content finalization, beta user recruitment
- **Launch Week (Week 0)**:
  - Day-by-day schedule: what goes live when, on which channel
  - Key milestones and success metrics
- **Post-Launch (Week 1-2)**:
  - Follow-up actions, engagement responses, iteration triggers
- **For each task**:
  - What: specific action
  - When: day or date
  - Channel: where it happens
  - Owner: founder or delegatable
  - Dependencies: what needs to happen first
- **Success Metrics**: How you'll know the launch worked (with specific numbers)
- **Contingency**: What to do if Day 1 is quiet

This should synthesize EVERYTHING above — ICP, positioning, messaging, channels, content, outreach — into one coordinated execution plan. Reference specific content pieces and outreach targets by name.`,
};

export async function generateGtmStep(
  step: GtmStepDefinition,
  project: Project,
  wikiPages: WikiPage[],
  priorArtifacts: Artifact[],
  connections: Connection[],
): Promise<string> {
  const context = buildContext(project, wikiPages, priorArtifacts, connections);
  const stepPrompt = stepPrompts[step.key] ?? `Generate the ${step.title} for this project.`;

  const { provider, model } = resolveProvider();

  const result = await generateText({
    model: provider.languageModel(model),
    system: `You are Fleet, a world-class GTM strategist. You are building Step ${step.number} of 7 in a complete go-to-market strategy.

Your output must be specific, actionable, and grounded in the project's actual research and network data. Never be generic. If the project lacks context for a section, say so and explain what data would improve it.

Format your output as clean markdown with clear headers and bullet points.`,
    prompt: `${context}\n\n---\n\n## Task: ${step.title}\n\n${stepPrompt}`,
    temperature: 0.6,
    maxOutputTokens: 4096,
  });

  return result.text;
}
