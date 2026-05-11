/**
 * Shipyard Marketplace Client
 *
 * Queries Shipyard's public REST API to discover APIs, competitors,
 * and pricing data for Fleet's research and GTM generation.
 */

const SHIPYARD_BASE_URL =
  process.env.SHIPYARD_API_URL ?? 'https://openshipyard.xyz';

export interface MarketplaceListing {
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  auth_type: string;
  pricing_model: string;
  base_url: string | null;
  capabilities: string[];
  cost_per_call: number | null;
  free_tier_calls: number | null;
  connection_count: number;
  uptime_percentage: number | null;
  avg_response_ms: number | null;
  proxy_enabled: boolean | null;
  default_price_usdc: number | null;
  version: string | null;
  api_categories: { slug: string; name: string } | null;
}

export interface MarketplaceSearchResult {
  listings: MarketplaceListing[];
  total: number;
}

export async function searchMarketplace(
  query: string,
  limit: number = 10,
): Promise<MarketplaceSearchResult> {
  try {
    const url = new URL('/api/v1/listings', SHIPYARD_BASE_URL);
    url.searchParams.set('search', query);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { listings: [], total: 0 };
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return { listings: [], total: 0 };
    }

    return {
      listings: data.data as MarketplaceListing[],
      total: data.meta?.total ?? data.data.length,
    };
  } catch {
    return { listings: [], total: 0 };
  }
}

export async function getMarketplaceRegistry(
  capabilities?: string,
): Promise<MarketplaceListing[]> {
  try {
    const url = new URL('/api/v1/registry', SHIPYARD_BASE_URL);
    if (capabilities) {
      url.searchParams.set('capabilities', capabilities);
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return [];
    }

    return data.data.apis ?? [];
  } catch {
    return [];
  }
}

export function formatListingForResearch(listing: MarketplaceListing): string {
  const lines: string[] = [];

  lines.push(`## ${listing.name}`);
  if (listing.short_description) {
    lines.push(listing.short_description);
  }
  lines.push('');

  if (listing.api_categories?.name) {
    lines.push(`**Category:** ${listing.api_categories.name}`);
  }
  lines.push(`**Pricing:** ${listing.pricing_model.replace('_', ' ')}`);

  if (listing.proxy_enabled && listing.default_price_usdc != null) {
    lines.push(`**x402 Price:** $${listing.default_price_usdc} USDC/call`);
    lines.push(`**Proxy URL:** ${SHIPYARD_BASE_URL}/x/${listing.slug}`);
  } else if (listing.cost_per_call != null) {
    lines.push(`**Cost:** $${listing.cost_per_call}/call`);
  }

  if (listing.capabilities.length > 0) {
    lines.push(`**Capabilities:** ${listing.capabilities.join(', ')}`);
  }
  if (listing.connection_count > 0) {
    lines.push(`**Connections:** ${listing.connection_count} developers using this`);
  }
  if (listing.uptime_percentage != null) {
    lines.push(`**Uptime:** ${listing.uptime_percentage}%`);
  }

  lines.push(`**Marketplace:** ${SHIPYARD_BASE_URL}/marketplace/${listing.slug}`);

  return lines.join('\n');
}
