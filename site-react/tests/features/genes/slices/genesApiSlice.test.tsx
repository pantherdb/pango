import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { buildTerm } from '@tests/fixtures/builders'
import { AspectType } from '@/@pango.core/data/config'
import { makeStore } from '@/app/store/store'
import { AutocompleteType } from '@/features/genes/models/gene'
import {
  useGetAutocompleteQuery,
  useGetGenesCountQuery,
  useGetGenesQuery,
  useGetGenesStatsQuery,
} from '@/features/genes/slices/genesApiSlice'

type GraphQLBody = { query: string; variables: Record<string, unknown> }

let fetchMock: ReturnType<typeof vi.fn<(request: Request) => Promise<Response>>>

/** Answers every GraphQL request with this JSON body. */
const respondWith = (body: unknown) => {
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
  )
}

const sentBody = (): Promise<GraphQLBody> => fetchMock.mock.calls[0][0].json()

const renderQuery = <T,>(useQuery: () => T) => {
  const store = makeStore()
  return renderHook(useQuery, {
    wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
  })
}

const rawGene = {
  gene: 'UniProtKB:P04637',
  geneSymbol: 'TP53',
  geneName: 'Cellular tumor antigen p53',
  terms: [
    buildTerm({ id: 'GO:0003700', aspect: AspectType.MOLECULAR_FUNCTION }),
    buildTerm({ id: 'GO:0005634', aspect: AspectType.CELLULAR_COMPONENT }),
  ],
}

const filter = { geneIds: ['UniProtKB:P04637'], slimTermIds: ['GO:0003824'], termIds: [] }

describe('genesApiSlice', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PANGO_API_URL', 'https://api.example.test/')
    fetchMock = vi.fn<(request: Request) => Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('pages through genes matching the filter and groups their terms by aspect', async () => {
    respondWith({ data: { genes: [rawGene] } })

    const { result } = renderQuery(() => useGetGenesQuery({ page: 2, size: 20, filter }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = await sentBody()
    expect(body.query).toContain('genes(filterArgs: $filterArgs, pageArgs: $pageArgs)')
    expect(body.variables).toEqual({ filterArgs: filter, pageArgs: { page: 2, size: 20 } })
    const [gene] = result.current.data?.genes ?? []
    expect(gene.geneSymbol).toBe('TP53')
    expect(gene.groupedTerms.mfs.map(term => term.id)).toEqual(['GO:0003700'])
    expect(gene.groupedTerms.ccs.map(term => term.id)).toEqual(['GO:0005634'])
  })

  it('asks for every gene when there is no filter', async () => {
    respondWith({ data: { genes: [] } })

    const { result } = renderQuery(() => useGetGenesQuery({ page: 0, size: 20 }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((await sentBody()).variables.filterArgs).toEqual({
      geneIds: [],
      slimTermIds: [],
      termIds: [],
    })
  })

  it('reports GraphQL errors as a failed query', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    respondWith({ errors: [{ message: 'Bad filter' }] })

    const { result } = renderQuery(() => useGetGenesQuery({ page: 0, size: 20, filter }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ message: 'Bad filter' })
  })

  it('counts the genes matching the filter, or zero when the count is missing', async () => {
    respondWith({ data: { genesCount: { total: 19532 } } })
    const counted = renderQuery(() => useGetGenesCountQuery({ filter }))
    await waitFor(() => expect(counted.result.current.isSuccess).toBe(true))
    expect(counted.result.current.data).toEqual({ total: 19532 })
    const body = await sentBody()
    expect(body.query).toContain('genesCount(filterArgs: $filterArgs)')
    expect(body.variables).toEqual({ filterArgs: filter })

    respondWith({ data: {} })
    const missing = renderQuery(() => useGetGenesCountQuery({ filter }))
    await waitFor(() => expect(missing.result.current.isSuccess).toBe(true))
    expect(missing.result.current.data).toEqual({ total: 0 })
  })

  it('returns the category statistics for the filter', async () => {
    const geneStats = {
      slimTermFrequency: {
        buckets: [
          {
            key: 'nucleus',
            docCount: 6000,
            meta: { id: 'GO:0005634', aspect: 'cellular component' },
          },
        ],
      },
    }
    respondWith({ data: { geneStats } })

    const { result } = renderQuery(() => useGetGenesStatsQuery({ filter }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(geneStats)
    const body = await sentBody()
    expect(body.query).toContain('geneStats(filterArgs: $filterArgs)')
    expect(body.variables).toEqual({ filterArgs: filter })
  })

  it('suggests genes for a keyword, with their terms grouped', async () => {
    respondWith({ data: { autocomplete: [rawGene] } })

    const { result } = renderQuery(() =>
      useGetAutocompleteQuery({ type: AutocompleteType.GENE, keyword: 'tp5' })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = await sentBody()
    expect(body.query).toMatch(/autocomplete\(\s*autocompleteType: \$autocompleteType/)
    expect(body.variables).toEqual({
      autocompleteType: 'gene',
      keyword: 'tp5',
      filterArgs: { geneIds: [], slimTermIds: [], termIds: [] },
    })
    expect(
      result.current.data.genes.map((gene: { geneSymbol: string }) => gene.geneSymbol)
    ).toEqual(['TP53'])
    expect(result.current.data.genes[0].groupedTerms.mfs).toHaveLength(1)
  })
})
