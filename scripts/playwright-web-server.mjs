import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const port = process.argv[2] ?? '3100';

rmSync('.next/dev/lock', { force: true });

const child = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', port], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});