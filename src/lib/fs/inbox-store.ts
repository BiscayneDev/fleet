import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

import { sourceSchema } from '../fleet/schemas';
import type { Source } from '../fleet/types';
import { resolveDataPath } from './path-utils';

const INBOX_DIRECTORY = 'Inbox';
const inboxCaptureSchema = z
  .object({
    content: z.string().trim().min(1),
  })
  .strict();

export type InboxItem = Source & { id: string };
export type CreateInboxItemInput = z.infer<typeof inboxCaptureSchema>;

function getInboxDirectory(): string {
  return resolveDataPath(INBOX_DIRECTORY);
}

function getInboxItemPath(id: string): string {
  return resolveDataPath(path.join(INBOX_DIRECTORY, `${id}.json`));
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildInboxTitle(content: string, type: InboxItem['type']): string {
  if (type === 'link') {
    return content;
  }

  const [firstLine = 'Untitled note'] = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return firstLine.slice(0, 120);
}

function parseInboxItem(payload: unknown): InboxItem {
  const parsed = sourceSchema.parse(payload);

  return sourceSchema.extend({ id: z.string().min(1) }).parse(parsed);
}

export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  const { content } = inboxCaptureSchema.parse(input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const type = isLikelyUrl(content) ? 'link' : 'note';
  const item = parseInboxItem({
    id,
    type,
    title: buildInboxTitle(content, type),
    body: content,
    origin: 'inbox',
    projectSlugs: [],
    ingestionStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  await mkdir(getInboxDirectory(), { recursive: true });
  await writeFile(getInboxItemPath(item.id), JSON.stringify(item, null, 2) + '\n', 'utf8');

  return item;
}

export async function listInboxItems(): Promise<InboxItem[]> {
  const inboxDirectory = getInboxDirectory();
  await mkdir(inboxDirectory, { recursive: true });

  const entries = await readdir(inboxDirectory, { withFileTypes: true });
  const items = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        try {
          const content = await readFile(path.join(inboxDirectory, entry.name), 'utf8');
          return parseInboxItem(JSON.parse(content) as unknown);
        } catch {
          return null;
        }
      }),
  );

  return items
    .filter((item): item is InboxItem => item !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
