import { screen, within } from '@testing-library/react'
import { serveBuilds } from '@tests/mocks/api'
import { FULL_BUILD } from '@tests/mocks/upstream'
import { renderRoute } from '@tests/test-utils'

const NCBI = '20261004T123000Z-all-9c2e'

const figure = (table: HTMLElement, name: RegExp) => within(table).getByRole('row', { name })

describe('DatasetPage', () => {
  it("compares a dataset's figures with its previous build", async () => {
    serveBuilds()
    renderRoute(`/builds/${NCBI}/datasets/pango-1`)
    const table = await screen.findByRole('table', { name: 'Figures' })
    expect(
      within(table).getByRole('columnheader', { name: 'Failed build (synthetic)' })
    ).toBeInTheDocument()
    expect(figure(table, /^Annotations/)).toHaveTextContent('77,31790,961−13,644 (−15.0 %)')
    expect(figure(table, /^Genes 20,851/)).toHaveTextContent('no change')
  })

  it('compares with any other build of the dataset', async () => {
    serveBuilds()
    const { user } = renderRoute(`/builds/${NCBI}/datasets/pango-1`)
    await user.click(await screen.findByRole('combobox', { name: 'Compare with' }))
    await user.click(
      await screen.findByRole('option', { name: /pango-1 as built in January 2026/ })
    )
    const table = screen.getByRole('table', { name: 'Figures' })
    expect(
      within(table).getByRole('columnheader', {
        name: 'pango-1 as built in January 2026 (backfill)',
      })
    ).toBeInTheDocument()
  })

  it("charts the dataset's make-up from the report", async () => {
    serveBuilds()
    renderRoute(`/builds/${FULL_BUILD}/datasets/pango-2`)
    const aspects = await screen.findByRole('figure', { name: 'Annotations by aspect' })
    expect(aspects).toHaveTextContent('biological process')
    expect(screen.getByRole('figure', { name: 'Terms per gene' })).toHaveTextContent('2-5')
    expect(
      screen.getByRole('figure', { name: 'Annotations by contributing group' })
    ).toHaveTextContent('UniProt')
  })

  it("shows every report section and the dataset's Elasticsearch check", async () => {
    serveBuilds()
    renderRoute(`/builds/${FULL_BUILD}/datasets/pango-2`)
    for (const title of [
      'Inputs',
      'Annotations',
      'Evidence and references',
      'Genes',
      'Consistency between the files',
      'Elasticsearch check',
    ]) {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByRole('table', { name: 'Top 25 GO terms' })).toBeInTheDocument()
  })

  it('has no comparison for a dataset no other build made', async () => {
    serveBuilds()
    renderRoute('/builds/20261004T090148Z-all-6000/datasets/pango-test')
    expect(
      await screen.findByText('no other build of this dataset to compare with')
    ).toBeInTheDocument()
  })

  it('says so for a dataset the build does not have', async () => {
    serveBuilds()
    renderRoute(`/builds/${FULL_BUILD}/datasets/pango-9`)
    expect(await screen.findByRole('alert')).toHaveTextContent('has no dataset pango-9')
  })
})
