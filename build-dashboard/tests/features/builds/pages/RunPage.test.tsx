import fs from 'node:fs'
import path from 'node:path'
import { screen, within } from '@testing-library/react'
import { serveBuilds } from '@tests/mocks/api'
import { FIXTURES } from '@tests/mocks/upstream'
import { renderRoute } from '@tests/test-utils'

const FAILED = '20261004T110000Z-all-f41d'
const runOf = (buildId: string, match: string) =>
  fs.readdirSync(path.join(FIXTURES, buildId, 'runs')).find(dir => dir.includes(match))!

describe('RunPage', () => {
  it('shows why a run failed and the errors it logged', async () => {
    serveBuilds()
    const { user } = renderRoute(`/builds/${FAILED}/runs/${runOf(FAILED, 'index_es-pango-2')}`)
    expect(await screen.findByRole('heading', { name: 'index_es · pango-2' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toHaveTextContent(
      'Failed build (synthetic)'
    )

    const errors = screen.getByRole('heading', { name: /Errors: 4/ }).parentElement!
    const grouped = within(errors).getByRole('button', {
      name: /×3 pango-2-pango-annotations: document a1/,
    })
    expect(grouped).toHaveAttribute('aria-expanded', 'false')
    await user.click(grouped)
    expect(within(errors).getByText(/document q9/)).toBeInTheDocument()

    const ops = screen.getByRole('table', { name: 'Elasticsearch operations' })
    expect(
      within(ops).getByRole('row', { name: /bulk pango-2-pango-annotations Failed 86,883 3/ })
    ).toBeInTheDocument()
  })

  it("shows a report run's sections and its counters", async () => {
    serveBuilds()
    const build = '20261004T090254Z-all-3002'
    renderRoute(`/builds/${build}/runs/${runOf(build, 'report-pango-1')}`)
    expect(
      await screen.findByRole('heading', { name: 'Consistency between the files' })
    ).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'genes_by_terms' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Phases' })).toHaveTextContent('evidence')
  })

  it('shows the NCBI calls of a get_articles run, failures first', async () => {
    serveBuilds()
    const build = '20261004T123000Z-all-9c2e'
    renderRoute(`/builds/${build}/runs/${runOf(build, 'get_articles')}`)
    const calls = await screen.findByRole('table', { name: 'HTTP calls' })
    expect(within(calls).getAllByText('error')).toHaveLength(2)
    expect(screen.getByText(/HTTPError ×2 \(HTTP 503\)/)).toBeInTheDocument()
  })

  it('says a running run is running, and polls it', async () => {
    serveBuilds()
    const build = '20261004T135700Z-all-7a10'
    renderRoute(`/builds/${build}/runs/${runOf(build, 'clean_annotations')}`)
    expect(await screen.findByText(/Updating every 2 s/)).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Phases' })).toHaveTextContent('Running')
  })

  it('names a run that does not exist', async () => {
    serveBuilds()
    renderRoute(`/builds/${FAILED}/runs/no-such-run`)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load run no-such-run')
  })
})
