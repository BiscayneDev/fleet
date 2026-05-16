import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { isVaultMode } from '@/lib/fs/waitlist-store';

const RUNTIME_STATE_FILE = path.join(
  homedir(),
  '.fleet',
  'state',
  'daemon-runtime.json',
);

/**
 * Daemon health endpoint.
 *
 * Returns:
 * - `ok: true` always (process is alive if this responds)
 * - `daemonMode: bool` — is FLEET_DAEMON_MODE=1?
 * - `vaultMode: bool` — is FLEET_VAULT_ROOT set?
 * - `runtime` — contents of ~/.fleet/state/daemon-runtime.json if the
 *   watcher wrote one, else null
 *
 * Used by launchd-style supervisors, `fleet status` tooling (future),
 * and tunnel setup verification ("can openshipyard.xyz reach my Fleet?").
 */
export async function GET(): Promise<NextResponse> {
  const daemonMode = process.env.FLEET_DAEMON_MODE === '1';

  let runtime: unknown = null;
  try {
    const content = await readFile(RUNTIME_STATE_FILE, 'utf8');
    runtime = JSON.parse(content);
  } catch {
    // No runtime state file — watcher isn't running. That's fine; the
    // server itself is still up.
  }

  return NextResponse.json({
    ok: true,
    daemonMode,
    vaultMode: isVaultMode(),
    runtime,
    serverTime: new Date().toISOString(),
  });
}
