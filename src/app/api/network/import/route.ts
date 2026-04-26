import { randomUUID } from 'node:crypto';

import { bulkCreateConnections, saveImportMeta } from '@/lib/fs/network-store';
import { parseLinkedInCSV } from '@/lib/network/linkedin-parser';
import { parseTwitterArchive } from '@/lib/network/twitter-parser';
import type { ConnectionPlatform, NetworkImportMeta } from '@/lib/fleet/types';

export async function POST(request: Request) {
  const body = await request.json();
  const { platform, content, filename } = body;

  if (!platform || !['twitter', 'linkedin'].includes(platform)) {
    return Response.json({ error: 'Platform must be "twitter" or "linkedin"' }, { status: 400 });
  }

  if (!content || typeof content !== 'string') {
    return Response.json({ error: 'File content is required' }, { status: 400 });
  }

  try {
    const inputs =
      (platform as ConnectionPlatform) === 'linkedin'
        ? parseLinkedInCSV(content)
        : parseTwitterArchive(content);

    if (inputs.length === 0) {
      return Response.json({ error: 'No connections found in the file' }, { status: 400 });
    }

    const result = await bulkCreateConnections(inputs);

    const meta: NetworkImportMeta = {
      id: randomUUID(),
      platform: platform as ConnectionPlatform,
      filename: filename ?? `${platform}-import`,
      connectionCount: result.total,
      newCount: result.created,
      updatedCount: result.updated,
      importedAt: new Date().toISOString(),
    };

    await saveImportMeta(meta);

    return Response.json({
      import: meta,
      summary: `Imported ${result.total} connections (${result.created} new, ${result.updated} updated)`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse file';
    return Response.json({ error: message }, { status: 400 });
  }
}
