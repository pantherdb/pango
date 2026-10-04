import { expect, test } from './fixtures/test'

test.describe('gene page', () => {
  test('shows the gene, its external links and the function summary', async ({ page }) => {
    await page.goto('/gene/UniProtKB:P04637')

    await expect(
      page.getByRole('heading', { name: 'TP53: PAN-GO functions and evidence' })
    ).toBeVisible()
    await expect(page).toHaveTitle('TP53 - PAN-GO')
    await expect(page.locator('a[href="https://www.uniprot.org/uniprotkb/P04637"]')).toBeVisible()
    await expect(page.getByText('HGNC:11998').first()).toBeVisible()
    await expect(page.getByText('Unknown function aspects')).toBeVisible()
  })

  test.describe('on desktop', () => {
    test.skip(({ isMobile }) => isMobile, 'desktop table')

    test('opens an annotation in the side drawer and closes it', async ({ page }) => {
      await page.goto('/gene/UniProtKB:P04637')

      // The annotation table's row (the function summary table also mentions the term).
      const row = page.getByRole('row', { name: /^MF protein binding/ })
      await row.click()

      const drawer = page.getByRole('dialog')
      await expect(drawer.getByText('Annotation Details')).toBeVisible()
      // The homology evidence names the mouse orthologue it came from.
      await expect(drawer.getByText('UniProtKB:P02340 (Tp53)')).toBeVisible()

      await drawer.getByRole('button', { name: 'Close dialog' }).click()
      await expect(drawer).toBeHidden()
    })
  })

  test.describe('on a phone', () => {
    test.skip(({ isMobile }) => !isMobile, 'phone cards')

    test('lists annotations as cards that open the drawer', async ({ page }) => {
      await page.goto('/gene/UniProtKB:P04637')

      // Phones get cards and collapsible summary sections instead of tables.
      await expect(page.getByRole('table')).toHaveCount(0)
      await page.getByText('apoptotic process', { exact: true }).last().tap()

      await expect(page.getByRole('dialog').getByText('Annotation Details')).toBeVisible()
    })
  })
})
