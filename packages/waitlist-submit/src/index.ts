import { randomBytes } from 'node:crypto';
import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * Input to the submit() helper.
 *
 * Call this from your landing page's server-side form handler. It commits
 * a markdown file under `waitlists/<product>/signups/<id>.md` in the
 * developer's vault repo. Fleet running locally watches the vault and
 * runs match logic against the dev's contacts.
 */
export interface SubmitInput {
  /** GitHub PAT with `contents:write` on the vault repo. */
  githubToken: string;
  /** Vault repo as `owner/repo`. e.g. `biscaynedev/halsey-vault`. */
  vaultRepo: string;
  /** Branch to commit to. Defaults to the repo's default branch. */
  vaultBranch?: string;
  /** Product slug (lowercase letters, numbers, dashes). */
  product: string;
  /** Submitter's email — required, validated. */
  email: string;
  /** Optional submitter name. */
  name?: string;
  /** Optional free-text context ("what are you building?"). */
  context?: string;
  /** Optional submission source (e.g. 'web-form', 'twitter-dm'). */
  source?: string;
  /** Honeypot field — if non-empty, the submission is silently dropped. */
  honeypot?: string;
}

const submitInputSchema = z.object({
  githubToken: z.string().min(1),
  vaultRepo: z
    .string()
    .regex(/^[^/\s]+\/[^/\s]+$/, 'vaultRepo must be in owner/repo form'),
  vaultBranch: z.string().optional(),
  product: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, {
      message: 'product must be lowercase alphanumerics and dashes',
    }),
  email: z.email().max(254),
  name: z.string().max(200).optional(),
  context: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
  honeypot: z.string().optional(),
});

export type SubmitResult =
  | {
      ok: true;
      signupId: string;
      commitSha: string;
      path: string;
    }
  | {
      ok: true;
      discarded: true; // honeypot triggered
      signupId: 'discarded';
    }
  | {
      ok: false;
      error: string;
    };

function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx < 0) return trimmed;
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx);
  const plusIdx = local.indexOf('+');
  if (plusIdx < 0) return trimmed;
  return local.slice(0, plusIdx) + domain;
}

function makeSignupId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = randomBytes(5).toString('hex');
  return `${ts}-${rand}`;
}

function renderSignupMarkdown(opts: {
  signupId: string;
  product: string;
  email: string;
  name?: string;
  source?: string;
  createdAt: string;
  context: string;
}): string {
  const frontmatter: Record<string, unknown> = {
    id: opts.signupId,
    product: opts.product,
    email: opts.email,
    createdAt: opts.createdAt,
  };
  if (opts.name) frontmatter.name = opts.name;
  if (opts.source) frontmatter.source = opts.source;
  return matter.stringify(opts.context, frontmatter);
}

/**
 * Commit a waitlist signup as a markdown file to a vault repo.
 *
 * Idempotency note: the signupId includes a random suffix, so the same
 * email can be submitted multiple times without conflict (Fleet's
 * matcher dedupes by email when surfacing matches, not by file). If
 * you need strict one-per-email semantics, dedupe in your form handler
 * before calling.
 */
export async function submit(input: SubmitInput): Promise<SubmitResult> {
  const parsed = submitInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; '),
    };
  }

  // Honeypot — silently accept and drop
  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    return { ok: true, discarded: true, signupId: 'discarded' };
  }

  const data = parsed.data;
  const [owner, repo] = data.vaultRepo.split('/');

  const octokit = new Octokit({ auth: data.githubToken });

  const signupId = makeSignupId();
  const createdAt = new Date().toISOString();
  const path = `waitlists/${data.product}/signups/${signupId}.md`;
  const content = renderSignupMarkdown({
    signupId,
    product: data.product,
    email: normalizeEmail(data.email),
    name: data.name,
    source: data.source,
    createdAt,
    context: data.context ?? '',
  });

  try {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `waitlist: ${data.product} signup`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: data.vaultBranch,
    });
    const commitSha = res.data.commit.sha ?? '';
    return { ok: true, signupId, commitSha, path };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `GitHub commit failed: ${message}` };
  }
}
