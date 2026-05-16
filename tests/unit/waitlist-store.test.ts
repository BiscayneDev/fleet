import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  upsertWaitlist,
  getWaitlist,
  listWaitlists,
  addSignup,
  getSignup,
  listSignups,
  addMatch,
  listMatches,
  isVaultMode,
} from '@/lib/fs/waitlist-store';

describe('waitlist-store', () => {
  let tempVault: string;
  let originalVaultEnv: string | undefined;
  let originalDataEnv: string | undefined;

  beforeEach(async () => {
    originalVaultEnv = process.env.FLEET_VAULT_ROOT;
    originalDataEnv = process.env.FLEET_DATA_ROOT;
    tempVault = await mkdtemp(path.join(tmpdir(), 'fleet-vault-test-'));
  });

  afterEach(async () => {
    await rm(tempVault, { recursive: true, force: true });

    if (originalVaultEnv === undefined) {
      delete process.env.FLEET_VAULT_ROOT;
    } else {
      process.env.FLEET_VAULT_ROOT = originalVaultEnv;
    }
    if (originalDataEnv === undefined) {
      delete process.env.FLEET_DATA_ROOT;
    } else {
      process.env.FLEET_DATA_ROOT = originalDataEnv;
    }
  });

  describe('vault mode', () => {
    beforeEach(() => {
      process.env.FLEET_VAULT_ROOT = tempVault;
    });

    it('reports vault mode', () => {
      expect(isVaultMode()).toBe(true);
    });

    it('creates and reads a waitlist config', async () => {
      const config = await upsertWaitlist({
        product: 'inference',
        name: 'Shipyard Inference',
      });

      expect(config.product).toBe('inference');
      expect(config.name).toBe('Shipyard Inference');
      expect(config.createdAt).toBeTruthy();

      const fetched = await getWaitlist('inference');
      expect(fetched).not.toBeNull();
      expect(fetched?.product).toBe('inference');
      expect(fetched?.name).toBe('Shipyard Inference');
    });

    it('upsert preserves createdAt and bumps updatedAt', async () => {
      const first = await upsertWaitlist({ product: 'inference' });
      await new Promise((r) => setTimeout(r, 10));
      const second = await upsertWaitlist({
        product: 'inference',
        description: 'Updated',
      });

      expect(second.createdAt).toBe(first.createdAt);
      expect(second.updatedAt).not.toBe(first.updatedAt);
      expect(second.description).toBe('Updated');
    });

    it('writes signups, normalizes email, sorts newest-first', async () => {
      await upsertWaitlist({ product: 'inference' });

      const a = await addSignup({
        product: 'inference',
        email: 'Test@Example.com',
      });
      expect(a.email).toBe('test@example.com');

      await new Promise((r) => setTimeout(r, 10));
      const b = await addSignup({
        product: 'inference',
        email: 'second@example.com',
      });

      const list = await listSignups('inference');
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe(b.id);
      expect(list[1].id).toBe(a.id);

      const readBack = await getSignup('inference', a.id);
      expect(readBack?.email).toBe('test@example.com');
    });

    it('preserves optional fields in signups', async () => {
      await upsertWaitlist({ product: 'inference' });
      const signup = await addSignup({
        product: 'inference',
        email: 'someone@example.com',
        name: 'Some One',
        source: 'web-form',
        context: 'Building agents',
      });

      const readBack = await getSignup('inference', signup.id);
      expect(readBack?.name).toBe('Some One');
      expect(readBack?.source).toBe('web-form');
      expect(readBack?.context).toBe('Building agents');
    });

    it('writes match records with wikilinks in body', async () => {
      await upsertWaitlist({ product: 'inference' });
      const signup = await addSignup({
        product: 'inference',
        email: 'chris@usepod.ai',
      });

      const match = await addMatch({
        signupId: signup.id,
        product: 'inference',
        email: signup.email,
        contactRef: 'contacts/chris-gilbert',
      });

      expect(match.signupId).toBe(signup.id);
      expect(match.contactRef).toBe('contacts/chris-gilbert');

      const list = await listMatches('inference');
      expect(list).toHaveLength(1);
      expect(list[0].signupId).toBe(signup.id);
    });

    it('lists waitlists sorted by updatedAt desc', async () => {
      await upsertWaitlist({ product: 'first' });
      await new Promise((r) => setTimeout(r, 10));
      await upsertWaitlist({ product: 'second' });

      const list = await listWaitlists();
      expect(list).toHaveLength(2);
      expect(list[0].product).toBe('second');
      expect(list[1].product).toBe('first');
    });

    it('returns null for non-existent waitlist', async () => {
      const config = await getWaitlist('does-not-exist');
      expect(config).toBeNull();
    });

    it('returns empty array when product has no signups yet', async () => {
      await upsertWaitlist({ product: 'empty' });
      const signups = await listSignups('empty');
      expect(signups).toEqual([]);
    });
  });

  describe('data root fallback mode (no vault)', () => {
    beforeEach(() => {
      delete process.env.FLEET_VAULT_ROOT;
      // Isolate data root to tempVault dir so we don't pollute the repo
      process.env.FLEET_DATA_ROOT = tempVault;
    });

    it('reports non-vault mode', () => {
      expect(isVaultMode()).toBe(false);
    });

    it('writes to data root when no vault configured', async () => {
      const config = await upsertWaitlist({ product: 'fallback' });
      expect(config.product).toBe('fallback');

      const fetched = await getWaitlist('fallback');
      expect(fetched).not.toBeNull();

      const signup = await addSignup({
        product: 'fallback',
        email: 'a@b.com',
      });
      const signups = await listSignups('fallback');
      expect(signups).toHaveLength(1);
      expect(signups[0].id).toBe(signup.id);
    });
  });
});
