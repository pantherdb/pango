import { afterEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import {
  buildAnnotation,
  buildCategoryTerm,
  buildEvidence,
  buildGene,
  buildReference,
} from '@tests/fixtures/builders'
import { AspectType } from '@/@pango.core/data/config'
import { getConfig } from '@/@pango.core/data/constants'
import type { Annotation } from '@/features/annotations/models/annotation'
import AnnotationDetails from '@/features/annotations/components/AnnotationDetails'

const config = getConfig()

const renderDetails = (annotation: Annotation) =>
  renderWithProviders(<AnnotationDetails annotation={annotation} />)

// Link lookups go through the visible text: name-matching role queries are slow in jsdom.
const linkByText = (container: HTMLElement, text: string) =>
  within(container).getByText(text).closest('a')

// Each section wraps its h2 title (in a header row) and its content.
const section = (title: string) =>
  screen.getByText(title, { selector: 'h2' }).parentElement?.parentElement as HTMLElement

describe('AnnotationDetails', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('describes the annotated gene and links to its page', () => {
    renderDetails(buildAnnotation())

    const gene = section('Gene')
    expect(linkByText(gene, 'UniProtKB:P04637')).toHaveAttribute('href', '/gene/UniProtKB:P04637')
    expect(within(gene).getByText('TP53')).toBeInTheDocument()
    expect(within(gene).getByText('Cellular tumor antigen p53')).toBeInTheDocument()
  })

  it('keeps the selected API version on the gene link', () => {
    window.history.replaceState({}, '', '/?apiVersion=pango-1')

    renderDetails(buildAnnotation())

    expect(linkByText(section('Gene'), 'UniProtKB:P04637')).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637?apiVersion=pango-1'
    )
  })

  it('shows the term and its function categories with their aspects', () => {
    renderDetails(
      buildAnnotation({
        slimTerms: [
          buildCategoryTerm(),
          buildCategoryTerm({
            id: 'GO:0023052',
            label: 'signaling',
            displayId: 'GO:0023052',
            aspect: AspectType.BIOLOGICAL_PROCESS,
          }),
        ],
      })
    )

    expect(linkByText(section('Term'), 'protein binding')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0005515`
    )
    const categories = section('GO Function Categories')
    expect(linkByText(categories, 'signaling')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0023052`
    )
    expect(within(categories).getByText('MF')).toBeInTheDocument()
    expect(within(categories).getByText('BP')).toBeInTheDocument()
  })

  it('links the contributing groups', () => {
    renderDetails(buildAnnotation())

    expect(linkByText(section('Group'), 'GO Central')).toHaveAttribute(
      'href',
      'http://geneontology.org'
    )
  })

  it('lists every reference of every evidence item, with authors', () => {
    renderDetails(
      buildAnnotation({
        evidence: [
          buildEvidence({
            withGeneId: buildGene({
              gene: 'UniProtKB:P02340',
              geneSymbol: 'Tp53',
              taxonId: '10090',
            }),
            references: [
              buildReference({ pmid: 'PMID:1', authors: ['Smith J', 'Doe A'] }),
              buildReference({ pmid: 'PMID:2' }),
              buildReference({ pmid: 'PMID:3' }),
            ],
          }),
          buildEvidence({
            withGeneId: undefined,
            references: [buildReference({ pmid: 'PMID:4' })],
          }),
        ],
      })
    )

    const evidence = section('Evidence (2)')
    for (const pmid of ['1', '2', '3', '4']) {
      expect(linkByText(evidence, `PMID:${pmid}`)).toHaveAttribute(
        'href',
        `${config.PUBMED_URL}${pmid}`
      )
    }
    expect(within(evidence).getByText('Smith J, Doe A')).toBeInTheDocument()
    expect(within(evidence).queryByText(/more reference/)).not.toBeInTheDocument()
  })

  it('names the ortholog behind homology evidence and links its taxon', () => {
    renderDetails(
      buildAnnotation({
        evidence: [
          buildEvidence({
            withGeneId: buildGene({
              gene: 'UniProtKB:P02340',
              geneSymbol: 'Tp53',
              geneName: 'Mouse cellular tumor antigen p53',
              taxonAbbr: 'MOUSE',
              taxonId: '10090',
            }),
          }),
        ],
      })
    )

    const evidence = section('Evidence (1)')
    expect(evidence).toHaveTextContent('UniProtKB:P02340 (Tp53)')
    expect(within(evidence).getByText('Mouse cellular tumor antigen p53')).toBeInTheDocument()
    expect(linkByText(evidence, 'MOUSE')).toHaveAttribute('href', `${config.TAXON_API_URL}10090`)
  })
})
