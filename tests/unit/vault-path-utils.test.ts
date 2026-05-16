import * as path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  getVaultRoot,
  hasVault,
  resolveVaultPath,
} from '../../src/lib/fs/vault-path-utils';

describe('vault-path-utils', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.FLEET_VAULT_ROOT;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FLEET_VAULT_ROOT;
    } else {
      process.env.FLEET_VAULT_ROOT = originalEnv;
    }
  });

  it('returns null when FLEET_VAULT_ROOT is not set', () => {
    delete process.env.FLEET_VAULT_ROOT;
    expect(getVaultRoot()).toBeNull();
    expect(hasVault()).toBe(false);
  });

  it('returns the configured vault root', () => {
    process.env.FLEET_VAULT_ROOT = '/tmp/my-vault';
    expect(getVaultRoot()).toBe('/tmp/my-vault');
    expect(hasVault()).toBe(true);
  });

  it('throws when resolving without a vault root configured', () => {
    delete process.env.FLEET_VAULT_ROOT;
    expect(() => resolveVaultPath('waitlists/foo')).toThrowError(
      /Vault root not configured/,
    );
  });

  it('resolves paths inside the vault root', () => {
    process.env.FLEET_VAULT_ROOT = '/tmp/my-vault';
    expect(
      resolveVaultPath('waitlists/inference/config.md')
        .split(path.sep)
        .join('/'),
    ).toMatch(/\/tmp\/my-vault\/waitlists\/inference\/config\.md$/);
  });

  it('blocks path traversal outside the vault root', () => {
    process.env.FLEET_VAULT_ROOT = '/tmp/my-vault';
    expect(() => resolveVaultPath('../secrets.txt')).toThrowError(
      'Path traversal blocked',
    );
  });
});
