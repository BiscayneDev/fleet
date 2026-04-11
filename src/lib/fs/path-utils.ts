import path from 'node:path';

export const DATA_ROOT =
  process.env.FLEET_DATA_ROOT || path.join(process.cwd(), 'data');

export function resolveDataPath(relativePath: string): string {
  const resolvedPath = path.resolve(DATA_ROOT, relativePath);
  const relativeToRoot = path.relative(DATA_ROOT, resolvedPath);

  if (
    relativeToRoot === '..' ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('Path traversal blocked');
  }

  return resolvedPath;
}
