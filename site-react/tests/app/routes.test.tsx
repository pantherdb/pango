import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { renderWithProviders } from '@tests/test-utils'
import { buildAnnotation } from '@tests/fixtures/builders'
import { queryResult } from '@tests/fixtures/mocks'
import type * as AnnotationsApiSlice from '@/features/annotations/slices/annotationsApiSlice'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import type * as TermsApiSlice from '@/features/terms/slices/termsApiSlice'
import { useGetAnnotationsQuery } from '@/features/annotations/slices/annotationsApiSlice'
import {
  useGetAutocompleteQuery,
  useGetGenesCountQuery,
  useGetGenesQuery,
  useGetGenesStatsQuery,
} from '@/features/genes/slices/genesApiSlice'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import { routes } from '@/app/routes'

vi.mock('@/analytics')

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesStatsQuery: vi.fn(),
  useGetGenesQuery: vi.fn(),
  useGetGenesCountQuery: vi.fn(),
  useGetAutocompleteQuery: vi.fn(),
}))

vi.mock('@/features/annotations/slices/annotationsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof AnnotationsApiSlice>()),
  useGetAnnotationsQuery: vi.fn(),
}))

vi.mock('@/features/terms/slices/termsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof TermsApiSlice>()),
  useGetTermStatsQuery: vi.fn(),
}))

const renderRoute = (path: string) =>
  renderWithProviders(
    <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />,
    { withRouter: false }
  )

// Whole pages are slow to render and query in jsdom; allow for a loaded CI machine.
describe('routes', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesStatsQuery).mockReturnValue(
      queryResult({ slimTermFrequency: { buckets: [] } })
    )
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 0 }))
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
    vi.mocked(useGetAnnotationsQuery).mockReturnValue(
      queryResult({ annotations: [buildAnnotation()] })
    )
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(undefined))
  })

  it('shows the home page with the filter panel at /', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { name: 'Functions of Human Genes' })).toBeInTheDocument()
    expect(screen.getByText('Interactive Graph and Filter')).toBeInTheDocument()
    expect(screen.getByText(/Results \(/)).toBeInTheDocument()
  })

  it('shows a gene page, without the filter panel, at /gene/:id', () => {
    renderRoute('/gene/UniProtKB:P04637')

    // jsdom puts a space after the gene symbol's <span> when computing the name.
    expect(
      screen.getByRole('heading', { name: /^TP53\s?: PAN-GO functions and evidence$/ })
    ).toBeInTheDocument()
    expect(vi.mocked(useGetAnnotationsQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ filterArgs: { geneIds: ['UniProtKB:P04637'] } })
    )
    expect(screen.queryByText('Interactive Graph and Filter')).not.toBeInTheDocument()
  })

  it.each([
    ['/about', 'About the PAN-GO human gene functionome'],
    ['/help', 'Tips for using the PAN-GO Functionome website'],
  ])('shows the %s page inside the site chrome', (path, heading) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByText('PAN-GO')).toBeInTheDocument()
    expect(screen.getByText('Contact us')).toBeInTheDocument()
    expect(screen.queryByText('Interactive Graph and Filter')).not.toBeInTheDocument()
  })
})
