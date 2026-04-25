import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    adapter: process.env.LLM_WIKI_ADAPTER,
    hasApiKey: !!(process.env.LLM_WIKI_API_KEY || process.env.NOUS_API_KEY),
    model: process.env.LLM_WIKI_MODEL,
    baseUrl: process.env.LLM_WIKI_BASE_URL,
  });
}
