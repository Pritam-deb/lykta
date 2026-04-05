import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke-test config.
 * Set BASE_URL env var to point at Vercel or any running Next.js instance.
 * Defaults to localhost:3000 (requires `pnpm dev` or `pnpm start` running).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Do NOT start a dev server automatically — tests run against BASE_URL.
  webServer: undefined,
})
