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

const ENRICHMENT_SYSTEM_PROMPT = `You are a GTM intelligence analyst. Given a company/product page, produce a concise executive briefing.

Return ONLY valid JSON:
{
  "summary": "2-3 sentences: what is this, who is it for, why does it matter right now",
  "concepts": ["key technology or business concepts this company uses"],
  "competitors": ["direct competitors — real companies, not generic categories"],
  "risks": ["real competitive or market risks — be specific, not generic"],
  "suggestedActions": ["1-2 concrete next steps for someone evaluating this space"]
}

Be specific and opinionated. Name real competitors. Flag real risks. No filler.`;

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
