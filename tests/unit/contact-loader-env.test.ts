import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  loadAllContacts,
  getDefaultVaultContactsDir,
} from '@/lib/fs/contact-loader';

describe('FLEET_VAULT_CONTACTS_DIR env var', () => {
  let tempVault: string;
  let tempData: string;
  let originalVault: string | undefined;
  let originalData: string | undefined;
  let originalContactsDir: string | undefined;

  beforeEach(async () => {
    originalVault = process.env.FLEET_VAULT_ROOT;
    originalData = process.env.FLEET_DATA_ROOT;
    originalContactsDir = process.env.FLEET_VAULT_CONTACTS_DIR;
    tempVault = await mkdtemp(path.join(tmpdir(), 'fleet-env-test-'));
    tempData = await mkdtemp(path.join(tmpdir(), 'fleet-env-data-'));
    process.env.FLEET_VAULT_ROOT = tempVault;
    process.env.FLEET_DATA_ROOT = tempData;
  });

  afterEach(async () => {
    await rm(tempVault, { recursive: true, force: true });
    await rm(tempData, { recursive: true, force: true });
    const restore = (
      key: 'FLEET_VAULT_ROOT' | 'FLEET_DATA_ROOT' | 'FLEET_VAULT_CONTACTS_DIR',
      value: string | undefined,
    ) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restore('FLEET_VAULT_ROOT', originalVault);
    restore('FLEET_DATA_ROOT', originalData);
    restore('FLEET_VAULT_CONTACTS_DIR', originalContactsDir);
  });

  it('defaults to "contacts" when env var is unset', () => {
    delete process.env.FLEET_VAULT_CONTACTS_DIR;
    expect(getDefaultVaultContactsDir()).toBe('contacts');
  });

  it('reads from FLEET_VAULT_CONTACTS_DIR when set', () => {
    process.env.FLEET_VAULT_CONTACTS_DIR = 'wiki/people';
    expect(getDefaultVaultContactsDir()).toBe('wiki/people');
  });

  it('loadAllContacts picks up the env var default', async () => {
    process.env.FLEET_VAULT_CONTACTS_DIR = 'wiki/people';

    const dir = path.join(tempVault, 'wiki', 'people');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'halsey.md'),
      `---\nname: Halsey\nemail: halsey@example.com\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].name).toBe('Halsey');
    expect(index.contacts[0].ref).toBe('wiki/people/halsey');
  });

  it('explicit vaultContactsDir option still overrides env var', async () => {
    process.env.FLEET_VAULT_CONTACTS_DIR = 'wiki/people';

    const dir = path.join(tempVault, 'custom');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'someone.md'),
      `---\nname: Someone\nemail: s@x.com\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts({ vaultContactsDir: 'custom' });
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].ref).toBe('custom/someone');
  });
});
