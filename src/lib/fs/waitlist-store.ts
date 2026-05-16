import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

import { resolveDataPath } from './path-utils';
import { hasVault, resolveVaultPath } from './vault-path-utils';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter';

const WAITLISTS_DIRECTORY = 'waitlists';

export const waitlistConfigSchema = z.object({
  product: z.string().min(1),
  name: z.string().optional(),
  description: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WaitlistConfig = z.infer<typeof waitlistConfigSchema>;

export const signupSchema = z.object({
  id: z.string().min(1),
  product: z.string().min(1),
  email: z.string(),
  name: z.string().optional(),
  source: z.string().optional(),
  context: z.string().default(''),
  createdAt: z.string(),
});

export type Signup = z.infer<typeof signupSchema>;

export const matchSchema = z.object({
  signupId: z.string().min(1),
  product: z.string().min(1),
  email: z.string(),
  contactRef: z.string(),
  matchedAt: z.string(),
});

export type Match = z.infer<typeof matchSchema>;

function resolveWaitlistPath(relativePath: string): string {
  const fullPath = path.join(WAITLISTS_DIRECTORY, relativePath);
  return hasVault() ? resolveVaultPath(fullPath) : resolveDataPath(fullPath);
}

function getWaitlistsRoot(): string {
  return hasVault()
    ? resolveVaultPath(WAITLISTS_DIRECTORY)
    : resolveDataPath(WAITLISTS_DIRECTORY);
}

function getProductDir(product: string): string {
  return resolveWaitlistPath(product);
}

function getConfigPath(product: string): string {
  return path.join(getProductDir(product), 'config.md');
}

function getSignupsDir(product: string): string {
  return path.join(getProductDir(product), 'signups');
}

function getSignupPath(product: string, signupId: string): string {
  return path.join(getSignupsDir(product), `${signupId}.md`);
}

function getMatchesDir(product: string): string {
  return path.join(getProductDir(product), 'matches');
}

function getMatchPath(product: string, signupId: string): string {
  return path.join(getMatchesDir(product), `${signupId}.md`);
}

export function isVaultMode(): boolean {
  return hasVault();
}

// --- Waitlist config ---

export interface UpsertWaitlistInput {
  product: string;
  name?: string;
  description?: string;
}

export async function upsertWaitlist(
  input: UpsertWaitlistInput,
): Promise<WaitlistConfig> {
  const productDir = getProductDir(input.product);
  await mkdir(productDir, { recursive: true });

  const now = new Date().toISOString();
  const existing = await getWaitlist(input.product);

  const config: WaitlistConfig = {
    product: input.product,
    name: input.name ?? existing?.name,
    description: input.description ?? existing?.description ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const frontmatter: Record<string, unknown> = {
    product: config.product,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
  if (config.name !== undefined) {
    frontmatter.name = config.name;
  }

  const markdown = stringifyMarkdownFile(frontmatter, config.description);
  await writeFile(getConfigPath(input.product), markdown, 'utf8');

  return config;
}

export async function getWaitlist(
  product: string,
): Promise<WaitlistConfig | null> {
  try {
    const content = await readFile(getConfigPath(product), 'utf8');
    const { frontmatter, body } = parseMarkdownFile(content);
    return waitlistConfigSchema.parse({
      ...frontmatter,
      description: body.trim(),
    });
  } catch {
    return null;
  }
}

export async function listWaitlists(): Promise<WaitlistConfig[]> {
  const root = getWaitlistsRoot();

  try {
    await mkdir(root, { recursive: true });
    const entries = await readdir(root, { withFileTypes: true });

    const configs = await Promise.all(
      entries.filter((e) => e.isDirectory()).map((e) => getWaitlist(e.name)),
    );

    return configs
      .filter((c): c is WaitlistConfig => c !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

// --- Signups ---

export interface AddSignupInput {
  product: string;
  email: string;
  name?: string;
  source?: string;
  context?: string;
}

function makeSignupId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

export async function addSignup(input: AddSignupInput): Promise<Signup> {
  const signupsDir = getSignupsDir(input.product);
  await mkdir(signupsDir, { recursive: true });

  const signup: Signup = {
    id: makeSignupId(),
    product: input.product,
    email: input.email.trim().toLowerCase(),
    name: input.name,
    source: input.source,
    context: input.context ?? '',
    createdAt: new Date().toISOString(),
  };

  const frontmatter: Record<string, unknown> = {
    id: signup.id,
    product: signup.product,
    email: signup.email,
    createdAt: signup.createdAt,
  };
  if (signup.name !== undefined) frontmatter.name = signup.name;
  if (signup.source !== undefined) frontmatter.source = signup.source;

  const markdown = stringifyMarkdownFile(frontmatter, signup.context);
  await writeFile(getSignupPath(input.product, signup.id), markdown, 'utf8');

  return signup;
}

export async function getSignup(
  product: string,
  signupId: string,
): Promise<Signup | null> {
  try {
    const content = await readFile(getSignupPath(product, signupId), 'utf8');
    const { frontmatter, body } = parseMarkdownFile(content);
    return signupSchema.parse({
      ...frontmatter,
      context: body.trim(),
    });
  } catch {
    return null;
  }
}

export async function listSignups(product: string): Promise<Signup[]> {
  const signupsDir = getSignupsDir(product);

  try {
    await mkdir(signupsDir, { recursive: true });
    const entries = await readdir(signupsDir, { withFileTypes: true });

    const signups = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map(async (e) => {
          try {
            const content = await readFile(
              path.join(signupsDir, e.name),
              'utf8',
            );
            const { frontmatter, body } = parseMarkdownFile(content);
            return signupSchema.parse({
              ...frontmatter,
              context: body.trim(),
            });
          } catch {
            return null;
          }
        }),
    );

    return signups
      .filter((s): s is Signup => s !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

// --- Matches ---

export interface AddMatchInput {
  signupId: string;
  product: string;
  email: string;
  contactRef: string;
}

export async function addMatch(input: AddMatchInput): Promise<Match> {
  const matchesDir = getMatchesDir(input.product);
  await mkdir(matchesDir, { recursive: true });

  const match: Match = {
    signupId: input.signupId,
    product: input.product,
    email: input.email,
    contactRef: input.contactRef,
    matchedAt: new Date().toISOString(),
  };

  const frontmatter = {
    signupId: match.signupId,
    product: match.product,
    email: match.email,
    contactRef: match.contactRef,
    matchedAt: match.matchedAt,
  };

  const body = `Signup [[waitlists/${match.product}/signups/${match.signupId}]] matched [[${match.contactRef}]] on ${match.matchedAt}.\n`;

  const markdown = stringifyMarkdownFile(frontmatter, body);
  await writeFile(
    getMatchPath(input.product, input.signupId),
    markdown,
    'utf8',
  );

  return match;
}

export async function listMatches(product: string): Promise<Match[]> {
  const matchesDir = getMatchesDir(product);

  try {
    await mkdir(matchesDir, { recursive: true });
    const entries = await readdir(matchesDir, { withFileTypes: true });

    const matches = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map(async (e) => {
          try {
            const content = await readFile(
              path.join(matchesDir, e.name),
              'utf8',
            );
            const { frontmatter } = parseMarkdownFile(content);
            return matchSchema.parse(frontmatter);
          } catch {
            return null;
          }
        }),
    );

    return matches
      .filter((m): m is Match => m !== null)
      .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
  } catch {
    return [];
  }
}
