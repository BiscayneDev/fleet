import { listConnections, getNetworkStats } from '@/lib/fs/network-store';
import type { ConnectionPlatform } from '@/lib/fleet/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as ConnectionPlatform | null;
  const projectSlug = searchParams.get('projectSlug');

  const [connections, stats] = await Promise.all([
    listConnections({
      platform: platform ?? undefined,
      projectSlug: projectSlug ?? undefined,
    }),
    getNetworkStats(),
  ]);

  return Response.json({ connections, stats });
}
