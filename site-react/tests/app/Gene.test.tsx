import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@tests/test-utils'
import { buildAnnotation, buildTerm } from '@tests/fixtures/builders'
import { mockMatchMedia, queryResult } from '@tests/fixtures/mocks'
import type * as AnnotationsApiSlice from '@/features/annotations/slices/annotationsApiSlice'
import { useGetAnnotationsQuery } from '@/features/annotations/slices/annotationsApiSlice'
import { AspectType, EvidenceType } from '@/@pango.core/data/config'
import { getConfig } from '@/@pango.core/data/constants'
import type { Annotation } from '@/features/annotations/models/annotation'
import { TermType } from '@/features/terms/models/term'
import Gene from '@/app/Gene'

vi.mock('@/features/annotations/slices/annotationsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof AnnotationsApiSlice>()),
  useGetAnnotationsQuery: vi.fn(),
}))

const config = getConfig()

const proteinBinding = buildAnnotation()
const apoptosis = buildAnnotation({
  term: buildTerm({
    id: 'GO:0006915',
    label: 'apoptotic process',
    displayId: 'GO:0006915',
    aspect: AspectType.BIOLOGICAL_PROCESS,
  }),
})
const unknownComponent = buildAnnotation({
  term: buildTerm({
    id: 'UNKNOWN:0003',
    label: 'Unknown cellular component',
    displayId: '',
    aspect: AspectType.CELLULAR_COMPONENT,
  }),
  termType: TermType.UNKNOWN,
  evidenceType: EvidenceType.NA,
  evidence: [],
  slimTerms: [],
})

const mockAnnotations = (annotations: Annotation[]) =>
  vi.mocked(useGetAnnotationsQuery).mockReturnValue(queryResult({ annotations }))

const renderGenePage = (options: Parameters<typeof renderWithProviders>[1] = {}) =>
  renderWithProviders(
    <Routes>
      <Route path="/gene/:id" element={<Gene />} />
    </Routes>,
    { route: '/gene/UniProtKB:P04637', ...options }
  )

// This page is large, and name-matching role queries call jsdom's (slow) getComputedStyle on
// every node they consider. Links are therefore found by their text, and page-wide role
// queries without a name pass `hidden: true` (jsdom loads no CSS, so nothing is hidden anyway).
const linkByText = (container: HTMLElement, text: string) =>
  within(container).getByText(text).closest('a')

// An info row renders "<label>:" next to its value; the row is their common parent.
const infoRow = (label: string) => screen.getByText(`${label}:`).parentElement as HTMLElement

// A summary stat renders its number just before the block holding its label.
const statValue = (label: string) =>
  screen.getByText(label).parentElement?.previousElementSibling?.textContent

const detailsTable = () => screen.getByText('Contributors').closest('table') as HTMLElement

describe('Gene page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a loading message until the annotations arrive', () => {
    vi.mocked(useGetAnnotationsQuery).mockReturnValue(
      queryResult(undefined, { isLoading: true, isSuccess: false })
    )

    renderGenePage()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('asks for the annotations of the gene in the URL', () => {
    mockAnnotations([proteinBinding])

    renderGenePage()

    expect(vi.mocked(useGetAnnotationsQuery)).toHaveBeenCalledWith({
      filterArgs: { geneIds: ['UniProtKB:P04637'] },
      pageArgs: { page: 0, size: 200 },
    })
  })

  it('names the gene in the heading and the browser tab', () => {
    mockAnnotations([proteinBinding])

    renderGenePage()

    expect(screen.getByRole('heading', { level: 1, hidden: true })).toHaveTextContent(
      'TP53: PAN-GO functions and evidence'
    )
    expect(document.title).toBe('TP53 - PAN-GO')
  })

  it('links the gene to its records in other resources, in new tabs', () => {
    mockAnnotations([proteinBinding])
    renderGenePage()

    const expectLink = (label: string, text: string, href: string) => {
      const link = linkByText(infoRow(label), text)
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
    }

    expect(within(infoRow('Gene')).getByText('TP53')).toBeInTheDocument()
    expect(within(infoRow('Protein')).getByText('Cellular tumor antigen p53')).toBeInTheDocument()
    expectLink(
      'GO annotations from all sources',
      'UniProtKB:P04637',
      `${config.AMIGO_GP_URL}UniProtKB:P04637`
    )
    expectLink(
      'PAN-GO evolutionary model for this family',
      'PTHR11447',
      `${config.PANTREE_URL}PTHR11447`
    )
    expectLink('UniProt', 'UniProtKB:P04637', 'https://www.uniprot.org/uniprotkb/P04637')
    expectLink(
      'PANTHER Tree Viewer',
      'PTHR11447',
      `${config.PANTHER_FAMILY_URL}book=PTHR11447&seq=${encodeURIComponent('HUMAN|HGNC=11998|UniProtKB=P04637')}`
    )
    expectLink(
      'UCSC Genome Browser',
      'chr17:7661779-7687538',
      `${config.UCSC_URL}17:7661779-7687538`
    )
    expectLink(
      'Alliance of Genome Resources',
      'HGNC:11998',
      'https://www.alliancegenome.org/gene/HGNC:11998'
    )
    expectLink(
      'HUGO Gene Nomenclature Committee',
      'HGNC:11998',
      'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:11998'
    )
    expectLink(
      'NCBI Gene',
      'TP53',
      'https://www.ncbi.nlm.nih.gov/gene/?term=(TP53%5BPreferred%20Symbol%5D)%20AND%209606%5BTaxonomy%20ID%5D'
    )
  })

  it('leaves out links the gene has no data for', () => {
    mockAnnotations([
      buildAnnotation({
        longId: 'HUMAN|UniProtKB=P04637',
        coordinatesChrNum: '',
        namedGene: false,
      }),
    ])

    renderGenePage()

    expect(screen.queryByText('Alliance of Genome Resources:')).not.toBeInTheDocument()
    expect(screen.queryByText('HUGO Gene Nomenclature Committee:')).not.toBeInTheDocument()
    expect(screen.queryByText('UCSC Genome Browser:')).not.toBeInTheDocument()
    expect(within(infoRow('NCBI Gene')).getByText('N/A')).toBeInTheDocument()
    expect(infoRow('NCBI Gene').querySelector('a')).toBeNull()
  })

  it('counts known annotations and unknown function aspects separately', () => {
    mockAnnotations([proteinBinding, apoptosis, unknownComponent])

    renderGenePage()

    expect(statValue('Annotations')).toBe('2')
    expect(statValue('Unknown function aspects')).toBe('1')
  })

  it('lists the annotations by aspect: function, then process, then component', () => {
    mockAnnotations([unknownComponent, apoptosis, proteinBinding])

    renderGenePage()

    const [, ...rows] = within(detailsTable()).getAllByRole('row', { hidden: true })
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('protein binding')
    expect(rows[1]).toHaveTextContent('apoptotic process')
    expect(rows[2]).toHaveTextContent('Unknown cellular component')
  })

  it('shows the annotation details as a table on desktop', () => {
    mockAnnotations([proteinBinding])

    renderGenePage()

    expect(within(detailsTable()).getByText('PMID:20959462')).toBeInTheDocument()
  })

  it('shows the annotation details as cards on phones', () => {
    mockMatchMedia(true)
    mockAnnotations([proteinBinding])

    renderGenePage()

    expect(screen.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
    expect(linkByText(document.body, 'PMID:20959462')).toHaveAttribute(
      'href',
      `${config.PUBMED_URL}20959462`
    )
  })

  it('closes the filter panel when the page opens', () => {
    mockAnnotations([proteinBinding])

    const { store } = renderGenePage({
      preloadedState: { drawer: { leftDrawerOpen: true, rightDrawerOpen: false } },
    })

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })

  it('offers both ways to report an annotation, each prefilled with the gene symbol', async () => {
    mockAnnotations([proteinBinding])

    const { user } = renderGenePage()

    const banner = linkByText(document.body, 'Submit a quick report')
    expect(banner).toHaveAttribute('target', '_blank')
    expect(banner).toHaveAttribute('href', expect.stringContaining('=TP53'))
    expect(banner?.getAttribute('href')).not.toContain('UniProtKB')

    await user.click(screen.getByLabelText('Report Annotation issue'))
    const [, floating] = screen.getAllByText('Submit a quick report').map(text => text.closest('a'))
    expect(floating).toHaveAttribute('href', banner?.getAttribute('href'))
  })
})
