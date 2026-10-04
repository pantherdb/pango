import { expect, test } from './fixtures/test'

test.describe('navigation', () => {
  test('reaches About and Help from the toolbar', async ({ page, isMobile }) => {
    await page.goto('/')
    const open = (name: string) =>
      isMobile
        ? page.getByRole('link', { name, exact: true }).tap()
        : page.getByRole('link', { name, exact: true }).click()

    await open('About')
    await expect(page).toHaveURL(/\/about$/)
    await expect(
      page.getByRole('heading', { name: 'About the PAN-GO human gene functionome' })
    ).toBeVisible()

    await open('Help')
    await expect(page).toHaveURL(/\/help$/)
    await expect(
      page.getByRole('heading', { name: 'Tips for using the PAN-GO Functionome website' })
    ).toBeVisible()
  })

  test('offers the previous API version by default', async ({ page, api }) => {
    await page.goto('/')

    await expect(page.getByText('Previous version available')).toBeVisible()
    await expect(page.getByRole('link', { name: /Switch to PANGO 1.0/ })).toHaveAttribute(
      'href',
      /apiVersion=pango-1/
    )
    await expect.poll(() => api.calls.at(-1)?.apiVersion).toBe('pango-2')
  })

  test('keeps a chosen API version on every request and link', async ({ page, api }) => {
    await page.goto('/?apiVersion=pango-1')

    await expect(page.getByText('New version available')).toBeVisible()
    await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
      'href',
      '/about?apiVersion=pango-1'
    )
    await expect.poll(() => api.calls.length).toBeGreaterThan(0)
    expect(new Set(api.calls.map(call => call.apiVersion))).toEqual(new Set(['pango-1']))
  })
})
