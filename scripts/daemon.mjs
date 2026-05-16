#!/usr/bin/env node
/**
 * Fleet daemon launcher.
 *
 * Spawns `next start` with FLEET_DAEMON_MODE=1 so the instrumentation
 * hook starts the waitlist file watcher. Tees stdout/stderr to
 * ~/.fleet/logs/daemon.log. Forwards SIGINT/SIGTERM to the child.
 *
 * Use directly:
 *   node scripts/daemon.mjs
 *
 * Or install via launchd:
 *   scripts/install-daemon-launchd.sh
 */

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const logDir = path.join(homedir(), '.fleet', 'logs');
await mkdir(logDir, { recursive: true });
const logPath = path.join(logDir, 'daemon.log');
const logStream = createWriteStream(logPath, { flags: 'a' });

const stamp = () => new Date().toISOString();

logStream.write(`\n--- Fleet daemon starting at ${stamp()} ---\n`);

const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');

const child = spawn(nextBin, ['start'], {
  env: {
    ...process.env,
    FLEET_DAEMON_MODE: '1',
    NODE_ENV: 'production',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout.pipe(logStream, { end: false });
child.stderr.pipe(logStream, { end: false });

child.on('exit', (code, signal) => {
  logStream.write(
    `\n--- Fleet daemon exited code=${code} signal=${signal} at ${stamp()} ---\n`,
  );
  logStream.end();
  process.exit(code ?? 1);
});

const forward = (sig) => () => {
  logStream.write(`\n--- Forwarding ${sig} to child at ${stamp()} ---\n`);
  child.kill(sig);
};
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));
