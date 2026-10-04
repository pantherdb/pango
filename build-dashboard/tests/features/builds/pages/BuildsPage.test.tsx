import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { screen, within } from '@testing-library/react'
import { serveBuilds } from '@tests/mocks/api'
import { renderRoute } from '@tests/test-utils'

describe('BuildsPage', () => {
  it('lists every build with its status, datasets and findings', async () => {
    serveBuilds()
    renderRoute('/')
    const table = await screen.findByRole('table', { name: 'Builds' })
    expect(within(table).getAllByRole('row')).toHaveLength(9)

    const failed = within(table).getByRole('row', { name: /Failed build \(synthetic\)/ })
    expect(within(failed).getByText('Failed')).toBeInTheDocument()
    expect(within(failed).getByLabelText('Fail')).toBeInTheDocument()

    const full = within(table).getByRole('row', { name: /full-data capture/ })
    expect(full).toHaveTextContent('90,961 annotations · 20,851 genes')
    expect(full).toHaveTextContent('86,886 annotations · 20,580 genes')
    expect(
      within(table).getByRole('row', { name: /pango-1 as built in January 2026/ })
    ).toHaveTextContent('data of 2026-01-25')
  })

  it('links each build to its page', async () => {
    serveBuilds()
    const { user, router } = renderRoute('/')
    await user.click(await screen.findByRole('link', { name: 'Failed build (synthetic)' }))
    expect(router.state.location.pathname).toBe('/builds/20261004T110000Z-all-f41d')
  })

  it('explains how to record a build when there is none yet', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'builds-'))
    try {
      serveBuilds({ buildsDir: empty })
      renderRoute('/')
      expect(await screen.findByText('No builds recorded yet')).toBeInTheDocument()
      expect(screen.getByText(/scripts\/all\.sh -i/)).toBeInTheDocument()
    } finally {
      fs.rmSync(empty, { recursive: true, force: true })
    }
  })

  it('says so when the dashboard server does not answer', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    renderRoute('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the builds')
  })
})
