import { GENE_TOTAL } from './fixtures/mockApi'
import { expect, test } from './fixtures/test'

test.describe('home page', () => {
  test('lists the first page of genes', async ({ page, api }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Functions of Human Genes' })).toBeVisible()
    await expect(page.getByRole('heading', { name: `Results (${GENE_TOTAL}) genes` })).toBeVisible()
    await expect(page.getByText(`1–20 of ${GENE_TOTAL}`)).toBeVisible()
    expect(api.lastVariables('GetGenes')).toMatchObject({ pageArgs: { page: 0, size: 20 } })
  })

  test('pages through the results', async ({ page, api }) => {
    await page.goto('/')
    await expect(page.getByText(`1–20 of ${GENE_TOTAL}`)).toBeVisible()

    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText(`21–40 of ${GENE_TOTAL}`)).toBeVisible()
    expect(api.lastVariables('GetGenes')).toMatchObject({ pageArgs: { page: 1 } })

    await page.getByRole('button', { name: 'Previous page' }).click()
    await expect(page.getByText(`1–20 of ${GENE_TOTAL}`)).toBeVisible()
  })

  test.describe('filter panel on desktop', () => {
    test.skip(({ isMobile }) => isMobile, 'the panel starts closed on phones')

    test('filters by a function category and clears it again', async ({ page, api }) => {
      await page.goto('/')

      await page.getByText('catalytic activity', { exact: true }).click()

      await expect(page.getByText('Function Categories (1)')).toBeVisible()
      await expect
        .poll(() => api.lastVariables('GetGenes'))
        .toMatchObject({ filterArgs: { slimTermIds: ['GO:0003824'] } })

      await page.getByRole('button', { name: 'Clear All Filters' }).click()
      await expect(page.getByText(/No Filters selected/)).toBeVisible()
    })

    test('finds a category by typing its name', async ({ page }) => {
      await page.goto('/')

      await page.getByPlaceholder('Type to Search...').fill('transp')
      await page.getByRole('option', { name: /transporter activity/ }).click()

      await expect(page.getByText('Function Categories (1)')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Remove transporter activity' })).toBeVisible()
    })

    test('drills into a category and filters by one of its terms', async ({ page, api }) => {
      await page.goto('/')

      await page.getByRole('button', { name: 'Show terms in catalytic activity' }).click()
      await expect(page.getByText('Directly annotated terms in this category (3)')).toBeVisible()

      await page.getByText('protein kinase activity', { exact: true }).click()

      await expect(page.getByText('Terms (1)')).toBeVisible()
      await expect
        .poll(() => api.lastVariables('GetGenes'))
        .toMatchObject({ filterArgs: { termIds: ['GO:0004672'] } })
    })

    test('hides and restores the filter panel', async ({ page }) => {
      await page.goto('/')

      await page.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(page.getByText('Interactive Graph and Filter')).toBeHidden()

      await page.getByRole('button', { name: 'Open Filter' }).click()
      await expect(page.getByText('Interactive Graph and Filter')).toBeVisible()
    })
  })

  test.describe('on a phone', () => {
    test.skip(({ isMobile }) => !isMobile, 'phone layout')

    test('shows genes as cards and opens the filter panel on demand', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByText('Interactive Graph and Filter')).toBeHidden()
      await expect(page.getByRole('link', { name: 'TP53' }).first()).toBeVisible()

      await page.getByRole('button', { name: 'Open Filter' }).tap()
      await expect(page.getByText('Interactive Graph and Filter')).toBeVisible()

      await page.getByRole('button', { name: 'View Results' }).tap()
      await expect(page.getByText('Interactive Graph and Filter')).toBeHidden()
    })
  })
})
