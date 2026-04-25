import path from 'node:path';

export function getDataRoot(): string {
  return process.env.FLEET_DATA_ROOT || path.join(process.cwd(), 'data');
}

export function resolveDataPath(relativePath: string): string {
  const dataRoot = getDataRoot();
  const resolvedPath = path.resolve(dataRoot, relativePath);
  const relativeToRoot = path.relative(dataRoot, resolvedPath);

  if (
    relativeToRoot === '..' ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('Path traversal blocked');
  }

  return resolvedPath;
}
