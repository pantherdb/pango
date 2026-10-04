import { expect, test } from '@playwright/test'

/**
 * The dashboard as a user reaches it: the real dev server and builds API over the fixture builds,
 * and a stub Elasticsearch and API for the live checks (playwright.config.ts). The real clock
 * runs here, so nothing below depends on whether a synthetic build reads as running or stale.
 */

const FULL = '20261004T090254Z-all-3002'
const FAILED = '20261004T110000Z-all-f41d'

test('the builds list shows every build with its status', async ({ page }) => {
  await page.goto('/')
  const table = page.getByRole('table', { name: 'Builds' })
  await expect(table.getByRole('row')).toHaveCount(9)
  await expect(table.getByRole('row', { name: /Failed build \(synthetic\)/ })).toContainText(
    'Failed'
  )
  await expect(
    table.getByRole('row', { name: /pango-1 \+ pango-2 full-data capture/ })
  ).toContainText('90,961 annotations')
})

test('a failed build says what failed and what never ran, and links to the run', async ({
  page,
}) => {
  await page.goto(`/builds/${FAILED}`)
  await expect(page.getByRole('heading', { name: 'Failed build (synthetic)' })).toBeVisible()
  const findings = page.locator('section', {
    has: page.getByRole('heading', { name: 'What to look at' }),
  })
  await expect(findings).toContainText('index_es failed for pango-2')
  await expect(findings).toContainText('1 planned step never ran')
  await expect(findings).toContainText('3 documents failed to load into the pango-2 indexes')

  const grid = page.getByRole('table', { name: 'Pipeline' })
  await expect(grid.getByLabel('verify: Never ran')).toBeVisible()
  await grid.getByRole('link', { name: 'index_es: Failed' }).click()
  await expect(page).toHaveURL(/\/runs\/.*index_es-pango-2/)
  await expect(
    page.getByText('3 documents failed to load, so the indexes are incomplete').first()
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: /Errors: 4/ })).toBeVisible()
})

test("a build's live check compares its counts with Elasticsearch and the API", async ({
  page,
}) => {
  await page.goto(`/builds/${FULL}`)
  await page.getByRole('button', { name: 'Check live now' }).click()
  const live = page.getByRole('table', { name: 'Live check' })
  // Two datasets × two kinds of document × (the cluster + one API).
  await expect(live.getByRole('row')).toHaveCount(9)
  await expect(live.locator('[data-status="match"]')).toHaveCount(8)
  await expect(live).toContainText("This build's index")
  await expect(live).toContainText('90,961')
})

test('a dataset page compares the figures with the previous build and charts the make-up', async ({
  page,
}) => {
  await page.goto(`/builds/${FULL}/datasets/pango-1`)
  const figures = page.getByRole('table', { name: 'Figures' })
  await expect(figures.getByRole('row', { name: /^Annotations/ })).toContainText('90,961')
  await expect(figures.getByRole('columnheader', { name: /January 2026/ })).toBeVisible()
  await expect(page.getByRole('figure', { name: 'Annotations by aspect' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Consistency between the files' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Elasticsearch check' })).toBeVisible()
})

test('the environments page says which build made each live index', async ({ page }) => {
  await page.goto('/live')
  const indexes = page.getByRole('table', { name: 'Indexes on stub' })
  await expect(indexes.getByRole('row', { name: /pango-1-pango-annotations/ })).toContainText(
    'pango-1 + pango-2 full-data capture'
  )
  await expect(indexes.getByRole('row', { name: /pango-old-pango-genes/ })).toContainText(
    'no recorded build'
  )
  const versions = page.getByRole('table', { name: 'Versions on stub' })
  await expect(versions.getByRole('row', { name: /latest/ })).toContainText('serves pango-1')
})
