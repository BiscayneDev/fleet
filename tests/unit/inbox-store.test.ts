import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createInboxItem, listInboxItems } from '../../src/lib/fs/inbox-store';

const tempDirs: string[] = [];

async function makeTempDataRoot(): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'fleet-inbox-store-'));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  delete process.env.FLEET_DATA_ROOT;
  await Promise.all(tempDirs.splice(0).map((tempDir) => rm(tempDir, { force: true, recursive: true })));
});

describe('inbox store', () => {
  it('stores pasted links as inbox items in Inbox/*.json', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    const item = await createInboxItem({
      content: 'https://example.com/research/brief',
    });

    const inboxPath = path.join(dataRoot, 'Inbox', `${item.id}.json`);
    const inboxStats = await stat(inboxPath);
    const storedContent = JSON.parse(await readFile(inboxPath, 'utf8')) as Record<string, unknown>;
    const listedItems = await listInboxItems();

    expect(inboxStats.isFile()).toBe(true);
    expect(item.type).toBe('link');
    expect(item.title).toBe('https://example.com/research/brief');
    expect(item.body).toBe('https://example.com/research/brief');
    expect(item.origin).toBe('inbox');
    expect(item.projectSlugs).toEqual([]);
    expect(item.ingestionStatus).toBe('pending');
    expect(storedContent).toMatchObject({
      id: item.id,
      type: 'link',
      title: 'https://example.com/research/brief',
      body: 'https://example.com/research/brief',
      origin: 'inbox',
      projectSlugs: [],
      ingestionStatus: 'pending',
    });
    expect(listedItems).toEqual([item]);
  });

  it('skips malformed inbox files when listing items', async () => {
    const dataRoot = await makeTempDataRoot();
    process.env.FLEET_DATA_ROOT = dataRoot;

    const validItem = await createInboxItem({
      content: 'A note worth keeping',
    });

    await writeFile(path.join(dataRoot, 'Inbox', 'broken.json'), '{not valid json', 'utf8');

    await expect(listInboxItems()).resolves.toEqual([validItem]);
  });
});
