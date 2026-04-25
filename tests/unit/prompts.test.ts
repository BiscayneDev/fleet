import { describe, it, expect } from 'vitest';
import { buildEnrichmentPrompt, parseEnrichmentResponse } from '@/lib/llm-wiki/prompts';

describe('buildEnrichmentPrompt', () => {
  it('includes the scraped text in the prompt', () => {
    const prompt = buildEnrichmentPrompt({
      title: 'Test Page',
      text: 'This is the content of the page.',
      url: 'https://example.com',
    });
    expect(prompt).toContain('Test Page');
    expect(prompt).toContain('This is the content of the page.');
  });

  it('truncates very long text to 8000 chars', () => {
    const longText = 'x'.repeat(10000);
    const prompt = buildEnrichmentPrompt({
      title: 'Long',
      text: longText,
      url: 'https://example.com',
    });
    // The prompt should contain at most 8000 chars of the content
    expect(prompt.length).toBeLessThan(longText.length);
  });
});

describe('parseEnrichmentResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      summary: 'A test summary.',
      concepts: ['concept1', 'concept2'],
      competitors: ['Competitor A'],
      risks: ['Risk 1'],
      suggestedActions: ['Action 1'],
    });
    const result = parseEnrichmentResponse(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.summary).toBe('A test summary.');
      expect(result.data.concepts).toHaveLength(2);
    }
  });

  it('handles markdown-wrapped JSON', () => {
    const wrapped = '```json\n{"summary":"test","concepts":[],"competitors":[],"risks":[],"suggestedActions":[]}\n```';
    const result = parseEnrichmentResponse(wrapped);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid JSON', () => {
    const result = parseEnrichmentResponse('not json');
    expect(result.ok).toBe(false);
  });

  it('rejects JSON without summary', () => {
    const result = parseEnrichmentResponse('{"concepts":["a"]}');
    expect(result.ok).toBe(false);
  });
});
