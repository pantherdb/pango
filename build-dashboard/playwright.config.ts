import { defineConfig, devices } from '@playwright/test'

const PORT = 4211
const STUB_PORT = 4212

/**
 * End-to-end specs against the real dev server and its builds API, reading the fixture builds,
 * with a stub Elasticsearch and API (e2e/stub-upstream.mjs) for the live checks. Nothing here
 * reaches a real cluster. First run on a new machine: `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'node e2e/stub-upstream.mjs',
      url: `http://localhost:${STUB_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: { STUB_PORT: String(STUB_PORT) },
    },
    {
      command: `npx vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BROWSER: 'none',
        PANGO_BUILDS_DIR: 'tests/fixtures/builds',
        LIVE_ES_TARGETS: `stub=http://localhost:${STUB_PORT}/es`,
        LIVE_API_TARGETS: `stub=http://localhost:${STUB_PORT}/graphql`,
        LIVE_BUILD_ES_URL: `http://localhost:${STUB_PORT}/es`,
      },
    },
  ],
})
