import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { queryResult } from '@tests/fixtures/mocks'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import type * as TermsApiSlice from '@/features/terms/slices/termsApiSlice'
import {
  useGetAutocompleteQuery,
  useGetGenesCountQuery,
  useGetGenesQuery,
  useGetGenesStatsQuery,
} from '@/features/genes/slices/genesApiSlice'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import App from '@/App'

// App registers the enrichment web component when its module loads. A plain function records
// that call; a vi.fn() would be wiped by `mockReset` before the test could look at it.
const { registeredTargets } = vi.hoisted(() => ({ registeredTargets: [] as unknown[] }))
vi.mock('panther-overrep-form/loader', () => ({
  defineCustomElements: (target: unknown) => {
    registeredTargets.push(target)
  },
}))

vi.mock('@/analytics')

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesStatsQuery: vi.fn(),
  useGetGenesQuery: vi.fn(),
  useGetGenesCountQuery: vi.fn(),
  useGetAutocompleteQuery: vi.fn(),
}))

vi.mock('@/features/terms/slices/termsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof TermsApiSlice>()),
  useGetTermStatsQuery: vi.fn(),
}))

// Whole pages are slow to render and query in jsdom; allow for a loaded CI machine.
describe('App', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesStatsQuery).mockReturnValue(
      queryResult({ slimTermFrequency: { buckets: [] } })
    )
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 0 }))
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(undefined))
  })

  it('registers the enrichment web component once, on the window', () => {
    expect(registeredTargets).toEqual([window])
  })

  it('renders the page for the browser URL', async () => {
    renderWithProviders(<App />, { withRouter: false })

    expect(
      await screen.findByRole('heading', { name: 'Functions of Human Genes' })
    ).toBeInTheDocument()
  })
})
