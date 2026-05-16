import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

import { listConnections } from './network-store';
import { hasVault, resolveVaultPath } from './vault-path-utils';
import { parseMarkdownFile } from './frontmatter';

export interface UnifiedContact {
  source: 'network' | 'vault';
  id: string;
  name: string;
  emails: string[];
  handles: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  company?: string;
  role?: string;
  tags: string[];
  ref: string;
}

export interface ContactIndex {
  contacts: UnifiedContact[];
  byEmail: Map<string, UnifiedContact>;
}

const vaultContactFrontmatterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  emails: z.array(z.string()).optional(),
  handles: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx < 0) return trimmed;
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx);
  const plusIdx = local.indexOf('+');
  if (plusIdx < 0) return trimmed;
  return local.slice(0, plusIdx) + domain;
}

export interface LoadContactsOptions {
  vaultContactsDir?: string;
}

export async function loadAllContacts(
  options: LoadContactsOptions = {},
): Promise<ContactIndex> {
  const networkContacts = await loadNetworkContacts();
  const vaultContacts = hasVault()
    ? await loadVaultContacts(options.vaultContactsDir ?? 'contacts')
    : [];

  const byEmail = new Map<string, UnifiedContact>();
  for (const c of networkContacts) {
    for (const email of c.emails) {
      byEmail.set(email, c);
    }
  }
  // Vault takes precedence on collision — user's curated source of truth
  for (const c of vaultContacts) {
    for (const email of c.emails) {
      byEmail.set(email, c);
    }
  }

  return {
    contacts: [...networkContacts, ...vaultContacts],
    byEmail,
  };
}

async function loadNetworkContacts(): Promise<UnifiedContact[]> {
  const connections = await listConnections();
  const out: UnifiedContact[] = [];
  for (const conn of connections) {
    const emails = conn.email ? [normalizeEmail(conn.email)] : [];
    out.push({
      source: 'network',
      id: conn.id,
      name: conn.displayName,
      emails,
      handles: { [conn.platform]: conn.handle },
      company: conn.company ?? undefined,
      role: conn.position ?? undefined,
      tags: conn.tags,
      ref: `Network/connections/${conn.id}`,
    });
  }
  return out;
}

async function loadVaultContacts(
  contactsDir: string,
): Promise<UnifiedContact[]> {
  let dir: string;
  try {
    dir = resolveVaultPath(contactsDir);
  } catch {
    return [];
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: UnifiedContact[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    try {
      const content = await readFile(path.join(dir, entry.name), 'utf8');
      const { frontmatter } = parseMarkdownFile(content);
      const parsed = vaultContactFrontmatterSchema.safeParse(frontmatter);
      if (!parsed.success) continue;

      const fm = parsed.data;
      const slug = entry.name.replace(/\.md$/, '');

      const rawEmails: string[] = [];
      if (fm.email) rawEmails.push(fm.email);
      if (fm.emails) rawEmails.push(...fm.emails);
      const emails = [...new Set(rawEmails.map(normalizeEmail))];

      out.push({
        source: 'vault',
        id: slug,
        name: fm.name ?? slug,
        emails,
        handles: fm.handles ?? {},
        company: fm.company,
        role: fm.role,
        tags: fm.tags ?? [],
        ref: `${contactsDir}/${slug}`,
      });
    } catch {
      continue;
    }
  }
  return out;
}
