import { describe, it, expect, afterEach } from 'vitest';
import { writeWikiPage, listWikiPages, getWikiPage } from '@/lib/fs/wiki-store';
import { rm } from 'node:fs/promises';
import { resolveDataPath } from '@/lib/fs/path-utils';
import * as path from 'node:path';

const TEST_PROJECT = `test-wiki-${Date.now()}`;

describe('wiki-store', () => {
  afterEach(async () => {
    const dir = resolveDataPath(path.join('Projects', TEST_PROJECT));
    await rm(dir, { recursive: true, force: true });
  });

  it('returns empty array when no pages exist', async () => {
    const pages = await listWikiPages(TEST_PROJECT);
    expect(pages).toEqual([]);
  });

  it('writes and reads a wiki page', async () => {
    const page = await writeWikiPage(TEST_PROJECT, {
      slug: 'test-page',
      title: 'Test Page',
      type: 'source',
      summary: 'A test summary.',
      body: '# Test Page\n\nSome content here.',
      sourceUrl: 'https://example.com',
    });

    expect(page.slug).toBe('test-page');
    expect(page.title).toBe('Test Page');
    expect(page.createdAt).toBeTruthy();

    const readBack = await getWikiPage(TEST_PROJECT, 'test-page');
    expect(readBack).not.toBeNull();
    expect(readBack?.title).toBe('Test Page');
    expect(readBack?.body).toContain('Some content here.');
  });

  it('lists multiple pages sorted by updatedAt', async () => {
    await writeWikiPage(TEST_PROJECT, {
      slug: 'page-1',
      title: 'Page 1',
      type: 'source',
      summary: 'First',
      body: 'Body 1',
    });

    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 50));

    await writeWikiPage(TEST_PROJECT, {
      slug: 'page-2',
      title: 'Page 2',
      type: 'concept',
      summary: 'Second',
      body: 'Body 2',
    });

    const pages = await listWikiPages(TEST_PROJECT);
    expect(pages).toHaveLength(2);
    // Most recently updated first
    expect(pages[0].slug).toBe('page-2');
    expect(pages[1].slug).toBe('page-1');
  });

  it('returns null for non-existent page', async () => {
    const page = await getWikiPage(TEST_PROJECT, 'does-not-exist');
    expect(page).toBeNull();
  });
});
