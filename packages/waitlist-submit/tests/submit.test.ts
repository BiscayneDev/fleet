import { describe, it, expect, vi, beforeEach } from 'vitest';
import matter from 'gray-matter';

const createOrUpdateFileContents = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: { createOrUpdateFileContents },
  })),
}));

// Import after mock is registered
const { submit } = await import('../src/index');

describe('submit', () => {
  beforeEach(() => {
    createOrUpdateFileContents.mockReset();
  });

  it('rejects invalid input (bad vaultRepo format)', async () => {
    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'not-a-repo-format',
      product: 'inference',
      email: 'a@b.com',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/vaultRepo/);
  });

  it('rejects invalid email', async () => {
    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'owner/repo',
      product: 'inference',
      email: 'not-an-email',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid product slug', async () => {
    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'owner/repo',
      product: 'BadSlug!',
      email: 'a@b.com',
    });
    expect(result.ok).toBe(false);
  });

  it('discards silently when honeypot is set', async () => {
    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'owner/repo',
      product: 'inference',
      email: 'a@b.com',
      honeypot: 'i-am-a-bot',
    });
    expect(result.ok).toBe(true);
    if (result.ok && 'discarded' in result) {
      expect(result.discarded).toBe(true);
      expect(result.signupId).toBe('discarded');
    } else {
      throw new Error('Expected discarded result');
    }
    expect(createOrUpdateFileContents).not.toHaveBeenCalled();
  });

  it('commits a signup file to the vault repo', async () => {
    createOrUpdateFileContents.mockResolvedValue({
      data: { commit: { sha: 'abc123' } },
    });

    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'biscaynedev/halsey-vault',
      product: 'inference',
      email: 'Chris@UsePod.ai',
      name: 'Chris G',
      context: 'Building agent infra',
      source: 'web-form',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    if ('discarded' in result) throw new Error('expected non-discarded');
    expect(result.commitSha).toBe('abc123');
    expect(result.path).toMatch(
      /^waitlists\/inference\/signups\/\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{10}\.md$/,
    );

    expect(createOrUpdateFileContents).toHaveBeenCalledTimes(1);
    const call = createOrUpdateFileContents.mock.calls[0][0];
    expect(call.owner).toBe('biscaynedev');
    expect(call.repo).toBe('halsey-vault');
    expect(call.path).toBe(result.path);
    expect(call.message).toBe('waitlist: inference signup');

    // Decode the committed content and verify the markdown shape
    const decoded = Buffer.from(call.content, 'base64').toString('utf8');
    const { data, content } = matter(decoded);
    expect(data.product).toBe('inference');
    expect(data.email).toBe('chris@usepod.ai'); // normalized
    expect(data.name).toBe('Chris G');
    expect(data.source).toBe('web-form');
    expect(content.trim()).toBe('Building agent infra');
  });

  it('passes branch when provided', async () => {
    createOrUpdateFileContents.mockResolvedValue({
      data: { commit: { sha: 'def' } },
    });

    await submit({
      githubToken: 'tok',
      vaultRepo: 'a/b',
      vaultBranch: 'feat/waitlists',
      product: 'p',
      email: 'x@y.com',
    });

    const call = createOrUpdateFileContents.mock.calls[0][0];
    expect(call.branch).toBe('feat/waitlists');
  });

  it('returns error when GitHub API throws', async () => {
    createOrUpdateFileContents.mockRejectedValue(new Error('Bad credentials'));

    const result = await submit({
      githubToken: 'tok',
      vaultRepo: 'a/b',
      product: 'p',
      email: 'x@y.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Bad credentials/);
  });

  it('strips +alias from email before storing', async () => {
    createOrUpdateFileContents.mockResolvedValue({
      data: { commit: { sha: 'sha' } },
    });

    await submit({
      githubToken: 'tok',
      vaultRepo: 'a/b',
      product: 'p',
      email: 'me+waitlist@example.com',
    });

    const call = createOrUpdateFileContents.mock.calls[0][0];
    const decoded = Buffer.from(call.content, 'base64').toString('utf8');
    const { data } = matter(decoded);
    expect(data.email).toBe('me@example.com');
  });
});
