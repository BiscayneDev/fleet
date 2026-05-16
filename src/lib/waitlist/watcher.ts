import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { getDataRoot } from '../fs/path-utils';
import { hasVault, resolveVaultPath } from '../fs/vault-path-utils';
import { runMatcher } from './matcher';
import { notify } from './notifier';

const WAITLISTS_DIRECTORY = 'waitlists';
const RUNTIME_STATE_FILE = path.join(
  homedir(),
  '.fleet',
  'state',
  'daemon-runtime.json',
);

export interface WatcherHandle {
  /** Stop the watcher (used in graceful shutdown). */
  stop(): Promise<void>;
  /** Diagnostic info written to the runtime state file. */
  info: WatcherInfo;
}

export interface WatcherInfo {
  pid: number;
  startedAt: string;
  watchedRoot: string;
  watchedPattern: string;
  vaultMode: boolean;
  waitlistCount: number;
  signupFileCount: number;
}

function getWaitlistsRoot(): string {
  return hasVault()
    ? resolveVaultPath(WAITLISTS_DIRECTORY)
    : path.join(getDataRoot(), WAITLISTS_DIRECTORY);
}

/**
 * Lightweight preflight: count what we'd be watching so the user gets
 * a sensible boot message and we can detect unexpectedly huge scopes
 * (which would mean misconfigured `FLEET_VAULT_ROOT`).
 */
async function inspectScope(root: string): Promise<{
  waitlistCount: number;
  signupFileCount: number;
}> {
  let waitlistCount = 0;
  let signupFileCount = 0;
  try {
    const productDirs = await readdir(root, { withFileTypes: true });
    for (const productDir of productDirs) {
      if (!productDir.isDirectory()) continue;
      waitlistCount++;
      try {
        const signups = await readdir(
          path.join(root, productDir.name, 'signups'),
          { withFileTypes: true },
        );
        signupFileCount += signups.filter(
          (e) => e.isFile() && e.name.endsWith('.md'),
        ).length;
      } catch {
        // signups dir may not exist yet
      }
    }
  } catch {
    // Root may not exist yet; that's fine — watcher will pick up new files
  }
  return { waitlistCount, signupFileCount };
}

async function writeRuntimeState(info: WatcherInfo): Promise<void> {
  try {
    await mkdir(path.dirname(RUNTIME_STATE_FILE), { recursive: true });
    await writeFile(
      RUNTIME_STATE_FILE,
      JSON.stringify(info, null, 2),
      'utf8',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[fleet:watcher] could not write runtime state:', msg);
  }
}

async function clearRuntimeState(): Promise<void> {
  try {
    await unlink(RUNTIME_STATE_FILE);
  } catch {
    // best effort
  }
}

/**
 * Start a chokidar watcher on every <waitlists-root>/<product>/signups/*.md.
 * On any new file event (debounced 250ms), runs the matcher and fires
 * an OS notification for each new match.
 *
 * Idempotent — the matcher tracks processed signup IDs, so multiple
 * events on the same file won't cause duplicate matches.
 *
 * Writes diagnostic state to ~/.fleet/state/daemon-runtime.json so other
 * tools (e.g. `fleet status` CLI someday) can see if the watcher is alive.
 */
export async function startWatcher(): Promise<WatcherHandle> {
  const root = getWaitlistsRoot();
  const pattern = path.join(root, '*', 'signups', '*.md');

  const scope = await inspectScope(root);
  const info: WatcherInfo = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    watchedRoot: root,
    watchedPattern: pattern,
    vaultMode: hasVault(),
    waitlistCount: scope.waitlistCount,
    signupFileCount: scope.signupFileCount,
  };
  await writeRuntimeState(info);

  console.log(
    `[fleet:watcher] watching ${pattern} ` +
      `(${info.waitlistCount} waitlist${info.waitlistCount === 1 ? '' : 's'}, ` +
      `${info.signupFileCount} existing signup file${
        info.signupFileCount === 1 ? '' : 's'
      })`,
  );

  const watcher: FSWatcher = chokidarWatch(pattern, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  });

  let debounce: NodeJS.Timeout | null = null;

  function scheduleMatch(): void {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      void runMatchAndNotify();
    }, 250);
  }

  async function runMatchAndNotify(): Promise<void> {
    try {
      const result = await runMatcher();
      for (const match of result.matched) {
        notify({
          title: `🎯 Fleet match: ${match.product}`,
          message: `${match.contactName} (${match.email})`,
          subtitle: 'Waitlist signup matched a known contact',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[fleet:watcher] match run failed:', message);
    }
  }

  watcher.on('add', scheduleMatch);
  watcher.on('change', scheduleMatch);
  watcher.on('error', (err) => {
    // Per Cabinet's pattern: log + keep daemon alive. EMFILE/ENOSPC
    // shouldn't kill the whole process.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      '[fleet:watcher] watcher error (continuing):',
      message,
      '\n  If you see EMFILE, raise your ulimit: `ulimit -n 4096`',
    );
  });

  return {
    info,
    async stop(): Promise<void> {
      if (debounce) clearTimeout(debounce);
      await watcher.close();
      await clearRuntimeState();
    },
  };
}
