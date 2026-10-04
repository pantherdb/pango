import { screen, within } from '@testing-library/react'
import { serveBuilds } from '@tests/mocks/api'
import { renderRoute } from '@tests/test-utils'

describe('EnvironmentsPage', () => {
  it('says which recorded build made each live index', async () => {
    serveBuilds()
    renderRoute('/live')
    const indexes = await screen.findByRole('table', { name: 'Indexes on local' })
    expect(within(indexes).getByRole('row', { name: /^pango-2-pango-genes/ })).toHaveTextContent(
      'pango-1 + pango-2 full-data capture'
    )
    expect(within(indexes).getByRole('row', { name: /^pango-old-pango-genes/ })).toHaveTextContent(
      'no recorded build'
    )
  })

  it("matches each API version's counts to builds, and says what latest serves", async () => {
    serveBuilds()
    renderRoute('/live')
    const versions = await screen.findByRole('table', { name: 'Versions on production' })
    expect(within(versions).getByRole('row', { name: /^pango-2/ })).toHaveTextContent(
      '86,88620,580'
    )
    expect(
      within(within(versions).getByRole('row', { name: /^pango-2/ })).getAllByRole('link').length
    ).toBeGreaterThan(0)
    expect(within(versions).getByRole('row', { name: /^latest/ })).toHaveTextContent(
      'serves pango-1'
    )
  })

  it('shows an unreachable cluster as such', async () => {
    const served = serveBuilds()
    served.upstream.down.es = true
    renderRoute('/live')
    expect(await screen.findByText('Unreachable')).toBeInTheDocument()
    expect(screen.getByText('fetch failed')).toBeInTheDocument()
  })

  it("explains an API whose bot protection refuses scripts, as production's does", async () => {
    const served = serveBuilds()
    served.upstream.challenge = true
    renderRoute('/live')
    expect(await screen.findByText('Blocked')).toBeInTheDocument()
    expect(screen.getByText(/The site answers browsers only/)).toBeInTheDocument()
  })
})
