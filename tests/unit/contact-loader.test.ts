import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  loadAllContacts,
  normalizeEmail,
} from '@/lib/fs/contact-loader';
import { bulkCreateConnections } from '@/lib/fs/network-store';

describe('normalizeEmail', () => {
  it('lowercases', () => {
    expect(normalizeEmail('Test@Example.com')).toBe('test@example.com');
  });
  it('trims whitespace', () => {
    expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
  it('strips +suffix from local part', () => {
    expect(normalizeEmail('test+waitlist@example.com')).toBe(
      'test@example.com',
    );
  });
  it('handles no @ gracefully', () => {
    expect(normalizeEmail('not-an-email')).toBe('not-an-email');
  });
});

describe('loadAllContacts', () => {
  let tempVault: string;
  let tempData: string;
  let originalVault: string | undefined;
  let originalData: string | undefined;

  beforeEach(async () => {
    originalVault = process.env.FLEET_VAULT_ROOT;
    originalData = process.env.FLEET_DATA_ROOT;
    tempVault = await mkdtemp(path.join(tmpdir(), 'fleet-vault-contacts-'));
    tempData = await mkdtemp(path.join(tmpdir(), 'fleet-data-contacts-'));
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

  it('loads network JSON contacts only when no vault configured', async () => {
    delete process.env.FLEET_VAULT_ROOT;

    await bulkCreateConnections([
      {
        platform: 'twitter',
        handle: 'somebody',
        displayName: 'Some Body',
        email: 'somebody@example.com',
      },
    ]);

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].source).toBe('network');
    expect(index.byEmail.get('somebody@example.com')?.name).toBe('Some Body');
  });

  it('loads vault markdown contacts when vault is configured', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });
    await writeFile(
      path.join(contactsDir, 'jane-doe.md'),
      `---\nname: Jane Doe\nemail: jane@example.com\ncompany: Acme\n---\n\nNotes.\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].source).toBe('vault');
    expect(index.contacts[0].name).toBe('Jane Doe');
    expect(index.byEmail.get('jane@example.com')?.company).toBe('Acme');
    expect(index.byEmail.get('jane@example.com')?.ref).toBe(
      'contacts/jane-doe',
    );
  });

  it('vault takes precedence over network on email collision', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    await bulkCreateConnections([
      {
        platform: 'linkedin',
        handle: 'janedoe',
        displayName: 'JD on LinkedIn',
        email: 'jane@example.com',
      },
    ]);

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });
    await writeFile(
      path.join(contactsDir, 'jane-doe.md'),
      `---\nname: Jane Doe (vault)\nemail: jane@example.com\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(2);
    expect(index.byEmail.get('jane@example.com')?.name).toBe('Jane Doe (vault)');
    expect(index.byEmail.get('jane@example.com')?.source).toBe('vault');
  });

  it('respects custom vaultContactsDir option', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const peopleDir = path.join(tempVault, 'wiki', 'people');
    await mkdir(peopleDir, { recursive: true });
    await writeFile(
      path.join(peopleDir, 'halsey.md'),
      `---\nname: Halsey\nemail: halsey@example.com\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts({ vaultContactsDir: 'wiki/people' });
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].ref).toBe('wiki/people/halsey');
  });

  it('handles a missing vault contacts dir gracefully', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;
    // contacts/ never created

    const index = await loadAllContacts();
    expect(index.contacts).toEqual([]);
    expect(index.byEmail.size).toBe(0);
  });

  it('skips markdown files whose frontmatter fails validation', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });

    await writeFile(
      path.join(contactsDir, 'good.md'),
      `---\nname: Good\nemail: good@x.com\n---\n`,
      'utf8',
    );
    await writeFile(
      path.join(contactsDir, 'bad.md'),
      `---\nname: 123\nemails: "not-an-array"\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].name).toBe('Good');
  });

  it('matches by email with +suffix normalization', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });
    await writeFile(
      path.join(contactsDir, 'me.md'),
      `---\nname: Me\nemail: me@example.com\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    const normalized = normalizeEmail('me+waitlist@example.com');
    expect(index.byEmail.get(normalized)?.name).toBe('Me');
  });

  it('indexes multiple emails per contact', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });
    await writeFile(
      path.join(contactsDir, 'multi.md'),
      `---\nname: Multi\nemail: primary@x.com\nemails: ["alt@x.com", "third@y.com"]\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.byEmail.get('primary@x.com')?.name).toBe('Multi');
    expect(index.byEmail.get('alt@x.com')?.name).toBe('Multi');
    expect(index.byEmail.get('third@y.com')?.name).toBe('Multi');
  });

  it('handles vault contact with no email (passthrough, not indexable)', async () => {
    process.env.FLEET_VAULT_ROOT = tempVault;

    const contactsDir = path.join(tempVault, 'contacts');
    await mkdir(contactsDir, { recursive: true });
    await writeFile(
      path.join(contactsDir, 'no-email.md'),
      `---\nname: Anon\nhandles:\n  twitter: anon\n---\n`,
      'utf8',
    );

    const index = await loadAllContacts();
    expect(index.contacts).toHaveLength(1);
    expect(index.contacts[0].name).toBe('Anon');
    expect(index.contacts[0].emails).toEqual([]);
    expect(index.byEmail.size).toBe(0);
  });
});
