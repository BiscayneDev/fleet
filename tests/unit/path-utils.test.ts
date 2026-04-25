import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveDataPath } from '../../src/lib/fs/path-utils';

describe('resolveDataPath', () => {
  it('resolves project files inside the data root', () => {
    expect(
      resolveDataPath('Projects/fleet-alpha/brief.md').split(path.sep).join('/'),
    ).toMatch(/Projects\/fleet-alpha\/brief\.md$/);
  });

  it('blocks path traversal outside the data root', () => {
    expect(() => resolveDataPath('../secrets.txt')).toThrowError(
      'Path traversal blocked',
    );
  });
});
