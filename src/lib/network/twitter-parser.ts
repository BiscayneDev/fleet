import type { CreateConnectionInput } from '../fs/network-store';

interface TwitterFollowingEntry {
  following: {
    accountId: string;
    userLink: string;
  };
}

function extractHandle(userLink: string): string {
  try {
    const url = new URL(userLink);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] ?? userLink;
  } catch {
    return userLink.replace(/^@/, '');
  }
}

export function parseTwitterArchive(content: string): CreateConnectionInput[] {
  let jsonStr = content.trim();

  // Twitter archive wraps data in a JS assignment:
  // window.YTD.following.part0 = [ ... ]
  const assignmentMatch = jsonStr.match(/=\s*(\[[\s\S]*\])\s*$/);
  if (assignmentMatch) {
    jsonStr = assignmentMatch[1];
  }

  let entries: TwitterFollowingEntry[];
  try {
    entries = JSON.parse(jsonStr) as TwitterFollowingEntry[];
  } catch {
    throw new Error('Could not parse Twitter archive. Expected JSON array or following.js format.');
  }

  if (!Array.isArray(entries)) {
    throw new Error('Expected an array of following entries');
  }

  const connections: CreateConnectionInput[] = [];

  for (const entry of entries) {
    const following = entry.following ?? entry;
    const userLink = (following as { userLink?: string }).userLink ?? '';
    const handle = extractHandle(userLink);

    if (!handle) continue;

    connections.push({
      platform: 'twitter',
      handle,
      displayName: handle,
      company: null,
      position: null,
      email: null,
      bio: null,
    });
  }

  return connections;
}
