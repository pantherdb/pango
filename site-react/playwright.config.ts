import { defineConfig, devices } from '@playwright/test'

const PORT = 4319

/**
 * End-to-end tests run a production build of the app in Chromium against canned GraphQL responses
 * (see e2e/fixtures), on a desktop and a phone viewport. First run on a new machine:
 * `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: './e2e',
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
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // A production build: what ships, and it serves instantly under parallel tests (the dev
    // server compiles modules on first request).
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Same-origin API path: e2e/fixtures answers it, so no CORS and no dependency on local .env files.
    env: { BROWSER: 'none', VITE_PANGO_API_URL: '/api/' },
    timeout: 180_000,
  },
})
