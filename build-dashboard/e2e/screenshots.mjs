// Screenshots of every page, for checking the layout by eye: `node e2e/screenshots.mjs [out dir]`
// with the dev server running (npm run dev, over the fixtures: PANGO_BUILDS_DIR=tests/fixtures/builds).
import { chromium } from '@playwright/test'

const base = process.env.DASHBOARD_URL ?? 'http://localhost:4210'
const out = process.argv[2] ?? 'test-results/screenshots'
const pages = [
  ['builds', '/'],
  ['build-full', '/builds/20261004T090254Z-all-3002'],
  ['build-failed', '/builds/20261004T110000Z-all-f41d'],
  ['build-running', '/builds/20261004T135700Z-all-7a10'],
  ['dataset', '/builds/20261004T090254Z-all-3002/datasets/pango-2'],
  ['dataset-ncbi', '/builds/20261004T123000Z-all-9c2e/datasets/pango-1'],
  [
    'run-index-failed',
    '/builds/20261004T110000Z-all-f41d/runs/20261004T111124Z-index_es-pango-2-48812-5e7a',
  ],
  [
    'run-report',
    '/builds/20261004T090254Z-all-3002/runs/20261004T090755Z-report-pango-1-69296-af06',
  ],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
for (const [name, path] of pages) {
  await page.goto(`${base}${path}`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  console.log(`${name}: ${path}`)
}
await browser.close()
