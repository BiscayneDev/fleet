import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { runMatcher } from '@/lib/waitlist/matcher';
import {
  upsertWaitlist,
  addSignup,
  listMatches,
} from '@/lib/fs/waitlist-store';
import { bulkCreateConnections } from '@/lib/fs/network-store';

describe('runMatcher', () => {
  let tempVault: string;
  let tempData: string;
  let stateFilePath: string;
  let originalVault: string | undefined;
  let originalData: string | undefined;

  beforeEach(async () => {
    originalVault = process.env.FLEET_VAULT_ROOT;
    originalData = process.env.FLEET_DATA_ROOT;
    tempVault = await mkdtemp(path.join(tmpdir(), 'fleet-vault-match-'));
    tempData = await mkdtemp(path.join(tmpdir(), 'fleet-data-match-'));
    stateFilePath = path.join(tempData, 'state', 'processed-signups.json');
    process.env.FLEET_VAULT_ROOT = tempVault;
    process.env.FLEET_DATA_ROOT = tempData;
  });

  afterEach(async () => {
    await rm(tempVault, { recursive: true, force: true });
    await rm(tempData, { recursive: true, force: true });
    if (originalVault === undefined) delete process.env.FLEET_VAULT_ROOT;
    else process.env.FLEET_VAULT_ROOT = originalVault;
    if (originalData === undefined) delete process.env.FLEET_DATA_ROOT;
    else process.env.FLEET_DATA_ROOT = originalData;
  });

  async function seedVaultContact(
    slug: string,
    frontmatter: Record<string, unknown>,
  ) {
    const dir = path.join(tempVault, 'contacts');
    await mkdir(dir, { recursive: true });
    const fm = Object.entries(frontmatter)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
    await writeFile(path.join(dir, `${slug}.md`), `---\n${fm}\n---\n`, 'utf8');
  }

  it('returns zero matches when there are no signups', async () => {
    const result = await runMatcher({ stateFilePath });
    expect(result.signupsScanned).toBe(0);
    expect(result.newMatches).toBe(0);
  });

  it('matches a signup against a vault contact by email', async () => {
    await seedVaultContact('chris-gilbert', {
      name: 'Chris Gilbert',
      email: 'chris@usepod.ai',
    });
    await upsertWaitlist({ product: 'inference' });
    const signup = await addSignup({
      product: 'inference',
      email: 'chris@usepod.ai',
    });

    const result = await runMatcher({ stateFilePath });
    expect(result.signupsScanned).toBe(1);
    expect(result.newMatches).toBe(1);
    expect(result.matched[0]).toMatchObject({
      product: 'inference',
      signupId: signup.id,
      email: 'chris@usepod.ai',
      contactRef: 'contacts/chris-gilbert',
      contactName: 'Chris Gilbert',
    });

    const matches = await listMatches('inference');
    expect(matches).toHaveLength(1);
    expect(matches[0].signupId).toBe(signup.id);
  });

  it('matches against network JSON contacts when no vault entry exists', async () => {
    await bulkCreateConnections([
      {
        platform: 'twitter',
        handle: 'someone',
        displayName: 'Some One',
        email: 'someone@example.com',
      },
    ]);
    await upsertWaitlist({ product: 'inference' });
    await addSignup({ product: 'inference', email: 'someone@example.com' });

    const result = await runMatcher({ stateFilePath });
    expect(result.newMatches).toBe(1);
    expect(result.matched[0].contactRef).toMatch(
      /^Network\/connections\/[^/]+$/,
    );
  });

  it('does not double-process signups across runs', async () => {
    await seedVaultContact('a', { name: 'A', email: 'a@x.com' });
    await upsertWaitlist({ product: 'p' });
    await addSignup({ product: 'p', email: 'a@x.com' });

    const first = await runMatcher({ stateFilePath });
    expect(first.signupsScanned).toBe(1);
    expect(first.newMatches).toBe(1);

    // Re-running should NOT re-process or duplicate matches
    const second = await runMatcher({ stateFilePath });
    expect(second.signupsScanned).toBe(0);
    expect(second.newMatches).toBe(0);

    const matches = await listMatches('p');
    expect(matches).toHaveLength(1);
  });

  it('only processes the filtered product when productFilter is set', async () => {
    await seedVaultContact('a', { name: 'A', email: 'a@x.com' });
    await seedVaultContact('b', { name: 'B', email: 'b@x.com' });
    await upsertWaitlist({ product: 'one' });
    await upsertWaitlist({ product: 'two' });
    await addSignup({ product: 'one', email: 'a@x.com' });
    await addSignup({ product: 'two', email: 'b@x.com' });

    const result = await runMatcher({
      productFilter: 'one',
      stateFilePath,
    });
    expect(result.signupsScanned).toBe(1);
    expect(result.matched[0].product).toBe('one');
  });

  it('skips signups that have no matching contact', async () => {
    await upsertWaitlist({ product: 'inference' });
    await addSignup({ product: 'inference', email: 'unknown@example.com' });

    const result = await runMatcher({ stateFilePath });
    expect(result.signupsScanned).toBe(1);
    expect(result.newMatches).toBe(0);
  });

  it('normalizes signup email when matching (+alias handled)', async () => {
    await seedVaultContact('me', { name: 'Me', email: 'me@example.com' });
    await upsertWaitlist({ product: 'p' });
    await addSignup({ product: 'p', email: 'me+waitlist@example.com' });

    const result = await runMatcher({ stateFilePath });
    expect(result.newMatches).toBe(1);
    expect(result.matched[0].contactName).toBe('Me');
  });

  it('respects custom vaultContactsDir', async () => {
    // Put contact in wiki/people instead of contacts/
    const dir = path.join(tempVault, 'wiki', 'people');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'halsey.md'),
      `---\nname: Halsey\nemail: halsey@example.com\n---\n`,
      'utf8',
    );

    await upsertWaitlist({ product: 'p' });
    await addSignup({ product: 'p', email: 'halsey@example.com' });

    const result = await runMatcher({
      stateFilePath,
      vaultContactsDir: 'wiki/people',
    });
    expect(result.newMatches).toBe(1);
    expect(result.matched[0].contactRef).toBe('wiki/people/halsey');
  });
});
