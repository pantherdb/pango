import { screen, within } from '@testing-library/react'
import { serveBuilds } from '@tests/mocks/api'
import { FULL_BUILD } from '@tests/mocks/upstream'
import { renderRoute } from '@tests/test-utils'

const FAILED = '20261004T110000Z-all-f41d'
const RUNNING = '20261004T135700Z-all-7a10'

const panel = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!

describe('BuildPage', () => {
  it('says what failed, worst first, with a link to the run', async () => {
    serveBuilds()
    renderRoute(`/builds/${FAILED}`)
    expect(
      await screen.findByRole('heading', { name: 'Failed build (synthetic)' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'index_es (pango-2): 3 documents failed to load, so the indexes are incomplete; see logfile.log'
      )
    ).toHaveLength(1)

    const findings = within(panel('What to look at')).getAllByRole('listitem')
    expect(findings.map(item => item.dataset.severity)).toEqual([
      'fail',
      'fail',
      'warn',
      'warn',
      'info',
      'info',
    ])
    expect(findings[0]).toHaveTextContent('index_es failed for pango-2')
    expect(within(findings[0]).getByRole('link', { name: 'open the run' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/builds/${FAILED}/runs/`)
    )
    expect(findings[2]).toHaveTextContent('1 planned step never ranpango-2: verify')
  })

  it('shows where the build stopped in the pipeline grid', async () => {
    serveBuilds()
    const { user, router } = renderRoute(`/builds/${FAILED}`)
    const grid = await screen.findByRole('table', { name: 'Pipeline' })
    expect(within(grid).getByLabelText('verify: Never ran')).toBeInTheDocument()
    expect(within(grid).getAllByRole('link', { name: 'verify: Done' })).toHaveLength(1)
    await user.click(within(grid).getByRole('link', { name: 'index_es: Failed' }))
    expect(router.state.location.pathname).toMatch(/\/runs\/.*index_es-pango-2/)
  })

  it('compares each dataset with its previous build', async () => {
    serveBuilds()
    renderRoute(`/builds/${FULL_BUILD}`)
    await screen.findByRole('heading', { name: 'pango-1 + pango-2 full-data capture' })
    expect(
      await screen.findByRole('link', { name: 'pango-1 as built in January 2026 (backfill)' })
    ).toBeInTheDocument()
    expect(screen.getAllByText('no change').length).toBeGreaterThanOrEqual(8)
  })

  it('polls while the build is going on, and says so', async () => {
    serveBuilds()
    renderRoute(`/builds/${RUNNING}`)
    expect(await screen.findByText(/Updating every 2 s/)).toBeInTheDocument()
    expect(
      within(await screen.findByRole('table', { name: 'Pipeline' })).getAllByLabelText(/: Waiting$/)
    ).toHaveLength(10)
  })

  it('checks the live cluster and APIs only when asked', async () => {
    const served = serveBuilds()
    const { user } = renderRoute(`/builds/${FULL_BUILD}`)
    await user.click(await screen.findByRole('button', { name: 'Check live now' }))
    const table = await screen.findByRole('table', { name: 'Live check' })
    // Two datasets × annotations and genes × (the cluster and one API).
    expect(within(table).getAllByRole('row')).toHaveLength(9)
    expect(table.querySelectorAll('[data-status="match"]')).toHaveLength(8)
    expect(within(table).getAllByText("This build's index")).toHaveLength(4)
    expect(served.calls).toContain(`/api/live/builds/${FULL_BUILD}`)
  })

  it('says when the live cluster is down', async () => {
    const served = serveBuilds()
    served.upstream.down.es = true
    const { user } = renderRoute(`/builds/${FULL_BUILD}`)
    await user.click(await screen.findByRole('button', { name: 'Check live now' }))
    const table = await screen.findByRole('table', { name: 'Live check' })
    expect(table.querySelectorAll('[data-status="unreachable"]')).toHaveLength(4)
    expect(table.querySelectorAll('[data-status="match"]')).toHaveLength(4)
  })

  it("says when an API's bot protection refuses the check", async () => {
    const served = serveBuilds()
    served.upstream.challenge = true
    const { user } = renderRoute(`/builds/${FULL_BUILD}`)
    await user.click(await screen.findByRole('button', { name: 'Check live now' }))
    const table = await screen.findByRole('table', { name: 'Live check' })
    expect(table.querySelectorAll('[data-status="blocked"]')).toHaveLength(4)
    expect(within(table).getAllByText(/Cloudflare challenge, HTTP 403/)).toHaveLength(4)
  })
})
