export interface EnrichmentInput {
  title: string;
  text: string;
  url: string;
}

export interface EnrichmentData {
  summary: string;
  concepts: string[];
  competitors: string[];
  risks: string[];
  suggestedActions: string[];
}

export interface ParsedResponse {
  ok: true;
  data: EnrichmentData;
}

export interface ParseError {
  ok: false;
  error: string;
}

export type ParseResult = ParsedResponse | ParseError;

const ENRICHMENT_SYSTEM_PROMPT = `You are a research analyst. Given a web page, extract structured intelligence for a GTM workspace.

Return ONLY valid JSON with these fields:
- summary: 2-3 sentence executive summary (what is this, why does it matter)
- concepts: array of key concepts/terms mentioned (3-7 items)
- competitors: array of competing products/companies mentioned (0-5 items)
- risks: array of potential risks or challenges implied (0-3 items)
- suggestedActions: array of concrete next actions for someone evaluating this space (1-3 items)

Be concise. No markdown, no explanation — just the JSON object.`;

export function buildEnrichmentPrompt(input: EnrichmentInput): string {
  const truncatedText = input.text.slice(0, 8000);

  return `Analyze this web page and extract structured intelligence.

URL: ${input.url}
Title: ${input.title}

--- CONTENT ---
${truncatedText}
--- END CONTENT ---`;
}

export function parseEnrichmentResponse(raw: string): ParseResult {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const data: EnrichmentData = {
      summary: String(parsed.summary ?? ''),
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.map(String) : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions.map(String)
        : [],
    };

    if (!data.summary) {
      return { ok: false, error: 'Missing summary in LLM response' };
    }

    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { ok: false, error: message };
  }
}
