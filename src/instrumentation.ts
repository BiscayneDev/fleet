/**
 * Next.js native server-startup hook.
 *
 * Called once per server process at boot. We use it to spin up the
 * waitlist file watcher when running in daemon mode (FLEET_DAEMON_MODE=1).
 *
 * In dev / regular `next start`, the watcher does not run — match runs
 * are triggered by the UI button or /api/waitlists/match endpoint instead.
 */
export async function register(): Promise<void> {
  if (process.env.FLEET_DAEMON_MODE !== '1') return;
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { startWatcher } = await import('./lib/waitlist/watcher');
  const handle = await startWatcher();

  const cleanup = (): void => {
    void handle.stop();
  };
  // Indirect process access hides this Node-only API from Next.js's
  // edge-runtime static analyzer. The early-returns above already
  // gate this branch to the nodejs runtime.
  const proc = (globalThis as { process?: NodeJS.Process }).process;
  proc?.once?.('SIGINT', cleanup);
  proc?.once?.('SIGTERM', cleanup);
}
