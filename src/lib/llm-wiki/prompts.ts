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

export const ENRICHMENT_SYSTEM_PROMPT = `You are a GTM intelligence analyst. Given a company/product page, produce a concise executive briefing.

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

/**
 * Extract the first balanced JSON object/array from raw text, ignoring any
 * prose or trailing chatter around it. Returns null if none parses.
 */
function extractFirstJson(cleaned: string): unknown | null {
  // Fast path: the whole string is JSON.
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : cleaned.indexOf('[');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function parseEnrichmentResponse(raw: string): ParseResult {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON shape is model-dependent
    const parsed = extractFirstJson(cleaned) as Record<string, any> | null;
    if (parsed === null || typeof parsed !== 'object') {
      return { ok: false, error: 'No JSON object found in response' };
    }

    // Handle multiple possible response formats
    let summary = '';
    let concepts: string[] = [];
    let competitors: string[] = [];
    let risks: string[] = [];
    let suggestedActions: string[] = [];

    console.log('[llm-wiki] Parsed JSON keys:', Object.keys(parsed));

    // Format 1: { summary, concepts, competitors, risks, suggestedActions }
    if (parsed.summary) {
      summary = String(parsed.summary);
      concepts = Array.isArray(parsed.concepts) ? parsed.concepts.map(String) : [];
      competitors = Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [];
      risks = Array.isArray(parsed.risks) ? parsed.risks.map(String) : [];
      suggestedActions = Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.map(String) : [];
    }
    // Format 2: { overview: { description, ... }, competitors: [...], etc }
    else if (parsed.overview) {
      summary = String(parsed.overview.description || parsed.overview.summary || '');
      concepts = [
        ...(Array.isArray(parsed.overview.key_products) ? parsed.overview.key_products : []),
        ...(Array.isArray(parsed.key_concepts) ? parsed.key_concepts : []),
        ...(Array.isArray(parsed.products) ? parsed.products : []),
      ].map(String);
      competitors = (Array.isArray(parsed.competitors) ? parsed.competitors : [])
        .map((c: unknown) => typeof c === 'string' ? c : String((c as Record<string, unknown>).name || c))
        .filter(Boolean);
      risks = (Array.isArray(parsed.risks) ? parsed.risks : [])
        .map((r: unknown) => typeof r === 'string' ? r : String((r as Record<string, unknown>).description || r))
        .filter(Boolean);
      suggestedActions = (Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [])
        .map((a: unknown) => typeof a === 'string' ? a : String((a as Record<string, unknown>).action || a))
        .filter(Boolean);
    }
    // Format 3: { description, key_features, ... }
    else if (parsed.description) {
      summary = String(parsed.description);
      concepts = (parsed.key_features || parsed.features || []).map(String);
      competitors = (parsed.competitors || []).map(String);
      risks = (parsed.risks || []).map(String);
      suggestedActions = (parsed.next_steps || parsed.actions || []).map(String);
    }

    if (!summary) {
      return { ok: false, error: 'Missing summary in LLM response' };
    }

    const data: EnrichmentData = { summary, concepts, competitors, risks, suggestedActions };
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { ok: false, error: message };
  }
}
