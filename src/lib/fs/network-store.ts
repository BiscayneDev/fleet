import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { connectionSchema, networkImportMetaSchema } from '../fleet/schemas';
import type { Connection, ConnectionPlatform, NetworkImportMeta } from '../fleet/types';
import { resolveDataPath } from './path-utils';

const NETWORK_DIRECTORY = 'Network';
const CONNECTIONS_DIRECTORY = 'connections';
const IMPORTS_DIRECTORY = 'imports';

function getConnectionsDirectory(): string {
  return resolveDataPath(path.join(NETWORK_DIRECTORY, CONNECTIONS_DIRECTORY));
}

function getImportsDirectory(): string {
  return resolveDataPath(path.join(NETWORK_DIRECTORY, IMPORTS_DIRECTORY));
}

function getConnectionPath(id: string): string {
  return path.join(getConnectionsDirectory(), `${id}.json`);
}

function dedupKey(platform: string, handle: string): string {
  return `${platform}:${handle.toLowerCase()}`;
}

export interface CreateConnectionInput {
  platform: ConnectionPlatform;
  handle: string;
  displayName: string;
  company?: string | null;
  position?: string | null;
  bio?: string | null;
  email?: string | null;
}

export async function createConnection(input: CreateConnectionInput): Promise<Connection> {
  const now = new Date().toISOString();
  const id = randomUUID();

  const connection = connectionSchema.parse({
    id,
    platform: input.platform,
    handle: input.handle,
    displayName: input.displayName,
    company: input.company ?? null,
    position: input.position ?? null,
    bio: input.bio ?? null,
    email: input.email ?? null,
    tags: [],
    relevanceNotes: null,
    projectSlugs: [],
    importedAt: now,
    updatedAt: now,
  });

  const dir = getConnectionsDirectory();
  await mkdir(dir, { recursive: true });
  await writeFile(getConnectionPath(id), JSON.stringify(connection, null, 2) + '\n', 'utf8');

  return connection;
}

export async function bulkCreateConnections(
  inputs: CreateConnectionInput[],
): Promise<{ created: number; updated: number; total: number }> {
  const existing = await listConnections();
  const existingMap = new Map<string, Connection>();
  for (const conn of existing) {
    existingMap.set(dedupKey(conn.platform, conn.handle), conn);
  }

  const dir = getConnectionsDirectory();
  await mkdir(dir, { recursive: true });

  let created = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const input of inputs) {
    const key = dedupKey(input.platform, input.handle);
    const existingConn = existingMap.get(key);

    if (existingConn) {
      const updatedConn: Connection = {
        ...existingConn,
        displayName: input.displayName || existingConn.displayName,
        company: input.company ?? existingConn.company,
        position: input.position ?? existingConn.position,
        bio: input.bio ?? existingConn.bio,
        email: input.email ?? existingConn.email,
        updatedAt: now,
      };
      await writeFile(
        getConnectionPath(existingConn.id),
        JSON.stringify(updatedConn, null, 2) + '\n',
        'utf8',
      );
      updated++;
    } else {
      const id = randomUUID();
      const connection = connectionSchema.parse({
        id,
        platform: input.platform,
        handle: input.handle,
        displayName: input.displayName,
        company: input.company ?? null,
        position: input.position ?? null,
        bio: input.bio ?? null,
        email: input.email ?? null,
        tags: [],
        relevanceNotes: null,
        projectSlugs: [],
        importedAt: now,
        updatedAt: now,
      });
      await writeFile(getConnectionPath(id), JSON.stringify(connection, null, 2) + '\n', 'utf8');
      created++;
    }
  }

  return { created, updated, total: inputs.length };
}

export async function listConnections(filters?: {
  platform?: ConnectionPlatform;
  projectSlug?: string;
}): Promise<Connection[]> {
  const dir = getConnectionsDirectory();

  try {
    await mkdir(dir, { recursive: true });
    const entries = await readdir(dir, { withFileTypes: true });

    const connections = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map(async (e) => {
          try {
            const content = await readFile(path.join(dir, e.name), 'utf8');
            return connectionSchema.parse(JSON.parse(content));
          } catch {
            return null;
          }
        }),
    );

    let result = connections.filter((c): c is Connection => c !== null);

    if (filters?.platform) {
      result = result.filter((c) => c.platform === filters.platform);
    }
    if (filters?.projectSlug) {
      result = result.filter((c) => c.projectSlugs.includes(filters.projectSlug!));
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch {
    return [];
  }
}

export async function getConnection(id: string): Promise<Connection | null> {
  try {
    const content = await readFile(getConnectionPath(id), 'utf8');
    return connectionSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function updateConnection(
  id: string,
  patch: Partial<Pick<Connection, 'tags' | 'relevanceNotes' | 'projectSlugs'>>,
): Promise<Connection | null> {
  const conn = await getConnection(id);
  if (!conn) return null;

  const updated: Connection = {
    ...conn,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(getConnectionPath(id), JSON.stringify(updated, null, 2) + '\n', 'utf8');
  return updated;
}

export async function saveImportMeta(meta: NetworkImportMeta): Promise<void> {
  const dir = getImportsDirectory();
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${meta.id}.json`),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8',
  );
}

export async function listImports(): Promise<NetworkImportMeta[]> {
  const dir = getImportsDirectory();

  try {
    await mkdir(dir, { recursive: true });
    const entries = await readdir(dir, { withFileTypes: true });

    const imports = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map(async (e) => {
          try {
            const content = await readFile(path.join(dir, e.name), 'utf8');
            return networkImportMetaSchema.parse(JSON.parse(content));
          } catch {
            return null;
          }
        }),
    );

    return imports
      .filter((m): m is NetworkImportMeta => m !== null)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  } catch {
    return [];
  }
}

export async function getNetworkStats(): Promise<{
  total: number;
  twitter: number;
  linkedin: number;
  topCompanies: Array<{ name: string; count: number }>;
}> {
  const connections = await listConnections();

  const companyCounts = new Map<string, number>();
  let twitter = 0;
  let linkedin = 0;

  for (const conn of connections) {
    if (conn.platform === 'twitter') twitter++;
    if (conn.platform === 'linkedin') linkedin++;
    if (conn.company) {
      companyCounts.set(conn.company, (companyCounts.get(conn.company) ?? 0) + 1);
    }
  }

  const topCompanies = [...companyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return { total: connections.length, twitter, linkedin, topCompanies };
}
