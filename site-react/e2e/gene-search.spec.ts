import { expect, test } from './fixtures/test'

const result = /TP53 Cellular tumor antigen p53/

test.describe('toolbar gene search on desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop toolbar')

  test('finds genes and links to their pages', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Search genes' }).click()
    await page.getByRole('textbox', { name: 'Search genes' }).fill('tp53')

    await expect(page.getByRole('link', { name: result })).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637'
    )
  })

  test('closes on a click outside, but not on its own results', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search genes' }).click()
    await page.getByRole('textbox', { name: 'Search genes' }).fill('tp53')
    await expect(page.getByRole('link', { name: result })).toBeVisible()

    await page.getByRole('link', { name: result }).dispatchEvent('mousedown')
    await expect(page.getByRole('button', { name: 'Close search' })).toBeVisible()

    // Somewhere the results dropdown doesn't cover.
    await page.getByRole('heading', { name: /^Results/ }).click()
    await expect(page.getByRole('button', { name: 'Close search' })).toBeHidden()
  })

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Search genes' })

    // Tab moves past the search button instead of opening the search.
    await trigger.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'PAN-GO on GitHub' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Close search' })).toBeHidden()

    // Enter opens it with the field focused; Escape closes it and hands focus back.
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('textbox', { name: 'Search genes' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })
})

test.describe('gene search on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone toolbar')

  test('closes with ✕ without the tap landing on what is underneath', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Search genes' }).tap()
    await page.getByRole('button', { name: 'Close search' }).tap()

    await expect(page.getByRole('button', { name: 'Close search' })).toBeHidden()
    await expect(page.getByAltText('Panther Logo')).toBeHidden()
  })

  test('searches from the field on the home page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('textbox', { name: 'Search genes' }).fill('tp53')

    await expect(page.getByRole('link', { name: result })).toBeVisible()
  })
})
