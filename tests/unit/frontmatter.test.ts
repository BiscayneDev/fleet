import { describe, expect, it } from 'vitest';

import {
  parseMarkdownFile,
  stringifyMarkdownFile,
} from '../../src/lib/fs/frontmatter';

describe('frontmatter helpers', () => {
  it('round-trips markdown with frontmatter', () => {
    const content = stringifyMarkdownFile({ title: 'Fleet Brief' }, '# Hello');
    const { frontmatter, body } = parseMarkdownFile(content);

    expect(frontmatter.title).toBe('Fleet Brief');
    expect(body).toContain('# Hello');
  });
});
