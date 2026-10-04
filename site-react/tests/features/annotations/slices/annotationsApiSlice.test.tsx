import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { buildAnnotation } from '@tests/fixtures/builders'
import { makeStore } from '@/app/store/store'
import { AutocompleteType } from '@/features/annotations/models/annotation'
import {
  useGetAnnotationStatsQuery,
  useGetAnnotationsCountQuery,
  useGetAnnotationsQuery,
  useGetSlimTermsAutocompleteQuery,
} from '@/features/annotations/slices/annotationsApiSlice'

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

// The API returns group shorthands only (no `detailedGroups`, dropped from the JSON); the client
// resolves them from groups.json.
const apiAnnotation = {
  ...buildAnnotation({ groups: ['GO_Central', 'MGI'] }),
  detailedGroups: undefined,
}

describe('annotationsApiSlice', () => {
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

  it("fetches a gene's annotations and resolves their contributing groups", async () => {
    respondWith({ data: { annotations: [apiAnnotation] } })

    const { result } = renderQuery(() =>
      useGetAnnotationsQuery({
        filterArgs: { geneIds: ['UniProtKB:P04637'] },
        pageArgs: { page: 0, size: 200 },
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = await sentBody()
    expect(body.query).toContain('annotations(filterArgs: $filterArgs, pageArgs: $pageArgs)')
    expect(body.variables).toEqual({
      filterArgs: { geneIds: ['UniProtKB:P04637'] },
      pageArgs: { page: 0, size: 200 },
    })
    const [annotation] = result.current.data?.annotations ?? []
    expect(annotation.term.id).toBe('GO:0005515')
    expect(annotation.detailedGroups).toEqual([
      { label: 'GO Central', id: 'http://geneontology.org', shorthand: 'GO_Central' },
      expect.objectContaining({ label: 'MGI', id: 'https://www.informatics.jax.org/' }),
    ])
  })

  it('asks for the first 50 annotations when no paging is given', async () => {
    respondWith({ data: { annotations: [] } })

    const { result } = renderQuery(() =>
      useGetAnnotationsQuery({ filterArgs: { geneIds: ['UniProtKB:P04637'] } })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((await sentBody()).variables.pageArgs).toEqual({ page: 0, size: 50 })
  })

  it('reports GraphQL errors as a failed query', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    respondWith({ errors: [{ message: 'Unknown gene' }] })

    const { result } = renderQuery(() =>
      useGetAnnotationsQuery({ filterArgs: { geneIds: ['UniProtKB:NOPE'] } })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ message: 'Unknown gene' })
  })

  it('counts annotations', async () => {
    respondWith({ data: { annotationsCount: { total: 42 } } })

    const { result } = renderQuery(() => useGetAnnotationsCountQuery(undefined))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ total: 42 })
    expect((await sentBody()).query).toContain('annotationsCount(filterArgs: $filterArgs)')
  })

  it('returns the annotation statistics for a gene', async () => {
    const annotationStats = {
      termTypeFrequency: { buckets: [{ key: 'known', docCount: 5 }] },
      slimTermFrequency: { buckets: [] },
    }
    respondWith({ data: { annotationStats } })

    const { result } = renderQuery(() =>
      useGetAnnotationStatsQuery({ filterArgs: { geneIds: ['UniProtKB:P04637'] } })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(annotationStats)
    const body = await sentBody()
    expect(body.query).toContain('annotationStats(filterArgs: $filterArgs)')
    expect(body.variables).toEqual({ filterArgs: { geneIds: ['UniProtKB:P04637'] } })
  })

  it('suggests function categories for a keyword', async () => {
    const suggestions = [
      { id: 'GO:0003824', label: 'catalytic activity', aspect: 'molecular function', count: 4500 },
    ]
    respondWith({ data: { slimTermsAutocomplete: suggestions } })

    const { result } = renderQuery(() =>
      useGetSlimTermsAutocompleteQuery({ type: AutocompleteType.SLIM_TERM, keyword: 'catal' })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(suggestions)
    const body = await sentBody()
    expect(body.query).toContain('slimTermsAutocomplete(keyword: $keyword')
    expect(body.variables).toEqual({ autocompleteType: 'slim_term', keyword: 'catal' })
  })
})
