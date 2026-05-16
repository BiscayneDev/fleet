import path from 'node:path';

export function getVaultRoot(): string | null {
  return process.env.FLEET_VAULT_ROOT || null;
}

export function hasVault(): boolean {
  return getVaultRoot() !== null;
}

export function resolveVaultPath(relativePath: string): string {
  const vaultRoot = getVaultRoot();
  if (!vaultRoot) {
    throw new Error('Vault root not configured (set FLEET_VAULT_ROOT)');
  }

  const resolvedPath = path.resolve(vaultRoot, relativePath);
  const relativeToRoot = path.relative(vaultRoot, resolvedPath);

  if (
    relativeToRoot === '..' ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('Path traversal blocked');
  }

  return resolvedPath;
}
