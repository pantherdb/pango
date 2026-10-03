import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildGene } from '@tests/fixtures/builders'
import { queryResult } from '@tests/fixtures/mocks'
import { AutocompleteType } from '@/features/genes/models/gene'
import { useGetAutocompleteQuery } from '@/features/genes/slices/genesApiSlice'
import GeneSearch from '@/features/genes/components/GeneSearch'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetAutocompleteQuery: vi.fn(),
}))

const mockResults = (genes = [buildGene()]) =>
  vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult({ genes }))

describe('GeneSearch', () => {
  beforeEach(() => {
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
  })

  it('shows matching genes once two characters are typed', async () => {
    mockResults()
    const { user } = renderWithProviders(<GeneSearch />)

    await user.type(screen.getByRole('textbox', { name: 'Search genes' }), 't')
    expect(screen.queryByRole('link', { name: /TP53/ })).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Search genes' }), 'p')
    expect(screen.getByRole('link', { name: /TP53/ })).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637'
    )
  })

  it('searches for the debounced, trimmed keyword', async () => {
    const { user } = renderWithProviders(<GeneSearch />)

    await user.type(screen.getByRole('textbox', { name: 'Search genes' }), '  tp5 ')

    await waitFor(() =>
      expect(vi.mocked(useGetAutocompleteQuery)).toHaveBeenLastCalledWith(
        { type: AutocompleteType.GENE, keyword: 'tp5' },
        { skip: false }
      )
    )
  })

  it('says so when no gene matches', async () => {
    mockResults([])
    const { user } = renderWithProviders(<GeneSearch />)

    await user.type(screen.getByRole('textbox', { name: 'Search genes' }), 'zzzz')

    expect(await screen.findByText('No genes found')).toBeInTheDocument()
  })

  it('stays put without autofocus when used inline', () => {
    renderWithProviders(<GeneSearch />)

    expect(screen.getByRole('textbox', { name: 'Search genes' })).not.toHaveFocus()
  })

  it('takes focus and closes on Escape when dismissible', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(<GeneSearch onClose={onClose} />)

    expect(screen.getByRole('textbox', { name: 'Search genes' })).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape')
  })

  it('closes on a click outside the field, not inside it', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <>
        <GeneSearch onClose={onClose} />
        <button type="button">elsewhere</button>
      </>
    )

    await user.click(screen.getByRole('textbox', { name: 'Search genes' }))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(onClose).toHaveBeenCalledExactlyOnceWith('outside')
  })

  it('treats the results, rendered in a portal, as part of the search', async () => {
    mockResults()
    const onClose = vi.fn()
    const { user } = renderWithProviders(<GeneSearch onClose={onClose} />, {
      mantineEnv: 'default',
    })

    await user.type(screen.getByRole('textbox', { name: 'Search genes' }), 'tp')
    fireEvent.mouseDown(await screen.findByText('TP53'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
