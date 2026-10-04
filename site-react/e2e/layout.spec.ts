import { expect, test } from './fixtures/test'

/**
 * Layout regressions from the Mantine migration, checked in a real browser (jsdom loads no CSS).
 * Geometry and computed styles rather than pixel snapshots, so they hold across machines.
 */
test.describe('layout on desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('catalytic activity', { exact: true })).toBeVisible()
  })

  test('long help tooltips wrap instead of running across the page', async ({ page }) => {
    await page.getByRole('button', { name: 'Close', exact: true }).hover()

    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible({ timeout: 5_000 })
    const box = await tooltip.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(330)
    expect(box?.height).toBeGreaterThan(40)
  })

  test('category count labels fit inside their pills', async ({ page }) => {
    const pills = page.getByRole('button', { name: /^\d+ genes$/ })
    await expect(pills.first()).toBeVisible()

    for (const pill of await pills.all()) {
      const clipped = await pill.evaluate(element => {
        const label = element.querySelector<HTMLElement>('.mantine-Button-label')
        return label ? label.scrollWidth > label.clientWidth : true
      })
      expect(clipped, await pill.innerText()).toBe(false)
    }
  })

  test('aspect checkboxes sit beside their labels', async ({ page }) => {
    const aspects = [
      ['Molecular Function', 'MF'],
      ['Biological Process', 'BP'],
      ['Cellular Component', 'CC'],
    ]
    for (const [name, shorthand] of aspects) {
      const checkbox = page.getByRole('checkbox', { name })
      const label = page.locator('label').filter({ has: checkbox }).getByText(shorthand, {
        exact: true,
      })
      const [box, text] = [await checkbox.boundingBox(), await label.boundingBox()]
      expect(box && text && box.x + box.width <= text.x, name).toBe(true)
    }
  })

  test('Tailwind utility classes win over Mantine component styles', async ({ page }) => {
    // The toolbar's Download button is a Mantine Button coloured by a Tailwind class.
    await expect(page.getByRole('button', { name: 'Download' })).toHaveCSS(
      'color',
      'rgb(235, 195, 54)'
    )
  })

  test('Clear All Filters is a readable, normally cased button', async ({ page }) => {
    await page.getByText('catalytic activity', { exact: true }).click()

    const clear = page.getByRole('button', { name: 'Clear All Filters' })
    await expect(clear).toHaveCSS('text-transform', 'none')
    await expect(clear).not.toHaveCSS('color', 'rgb(255, 255, 255)')
  })
})
