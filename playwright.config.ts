import { defineConfig } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `rm -f .next/dev/lock && npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    port,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
