import { defineConfig, devices } from '@playwright/test';

/**
 * These run against an already-running stack: `npm run dev` here and the API
 * on :3000. They are the launch criterion written down - a stranger finds a
 * product and places an order - so they exercise the real browser, not jsdom.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
