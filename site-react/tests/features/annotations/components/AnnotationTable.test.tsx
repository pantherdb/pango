import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import {
  buildAnnotation,
  buildCategoryTerm,
  buildEvidence,
  buildGene,
  buildReference,
} from '@tests/fixtures/builders'
import { EVIDENCE_TYPE_MAP, EvidenceType } from '@/@pango.core/data/config'
import { getConfig } from '@/@pango.core/data/constants'
import type { Annotation, Group } from '@/features/annotations/models/annotation'
import AnnotationTable from '@/features/annotations/components/AnnotationTable'

const config = getConfig()

// Evidence inferred from the mouse ortholog (taxon ids are numeric in PAN-GO data).
const mouseEvidence = buildEvidence({
  withGeneId: buildGene({
    gene: 'UniProtKB:P02340',
    geneSymbol: 'Tp53',
    geneName: 'Mouse cellular tumor antigen p53',
    taxonAbbr: 'MOUSE',
    taxonId: '10090',
  }),
  references: [buildReference({ pmid: 'PMID:111', title: 'Mouse paper' })],
})

const directEvidence = (pmids: string[]) =>
  buildEvidence({
    withGeneId: undefined,
    references: pmids.map(pmid => buildReference({ pmid, title: `Paper ${pmid}` })),
  })

const renderTable = (annotations: Annotation[], props = {}) =>
  renderWithProviders(<AnnotationTable annotations={annotations} {...props} />)

// Link lookups go through the visible text: name-matching role queries are slow in jsdom.
const linkByText = (container: HTMLElement, text: string) =>
  within(container).getByText(text).closest('a')

const bodyRows = () => screen.getAllByRole('row', { hidden: true }).slice(1)

describe('AnnotationTable', () => {
  it('shows each annotation with its term, function categories and contributors', () => {
    renderTable([buildAnnotation()])

    const [row] = bodyRows()
    expect(linkByText(row, 'protein binding')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0005515`
    )
    expect(linkByText(row, 'catalytic activity')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0003824`
    )
    expect(linkByText(row, 'GO Central')).toHaveAttribute('href', 'http://geneontology.org')
    expect(within(row).getAllByText('MF')).toHaveLength(2)
  })

  it('names the ortholog behind homology evidence and links its taxon', () => {
    renderTable([buildAnnotation({ evidence: [mouseEvidence] })])

    const [row] = bodyRows()
    expect(row).toHaveTextContent('UniProtKB:P02340 (Tp53)')
    expect(within(row).getByText('Mouse cellular tumor antigen p53')).toBeInTheDocument()
    expect(linkByText(row, 'MOUSE')).toHaveAttribute('href', `${config.TAXON_API_URL}10090`)
  })

  it('links each reference to PubMed with its title and date', () => {
    renderTable([
      buildAnnotation({
        evidence: [
          buildEvidence({
            withGeneId: undefined,
            references: [buildReference({ pmid: 'PMID:20959462', date: '2010' })],
          }),
        ],
      }),
    ])

    const [row] = bodyRows()
    expect(linkByText(row, 'PMID:20959462')).toHaveAttribute('href', `${config.PUBMED_URL}20959462`)
    expect(row).toHaveTextContent(
      'p53 and its mutants in tumor cell migration and invasion. (2010)'
    )
    expect(within(row).queryByText('MOUSE')).not.toBeInTheDocument()
  })

  it('shows two references and two evidence items, then counts the rest', () => {
    renderTable([
      buildAnnotation({
        evidence: [
          directEvidence(['PMID:1', 'PMID:2', 'PMID:3']),
          directEvidence(['PMID:4']),
          directEvidence(['PMID:5']),
        ],
      }),
    ])

    const [row] = bodyRows()
    expect(within(row).getByText('PMID:1')).toBeInTheDocument()
    expect(within(row).getByText('PMID:2')).toBeInTheDocument()
    expect(within(row).queryByText('PMID:3')).not.toBeInTheDocument()
    expect(within(row).getByText('PMID:4')).toBeInTheDocument()
    expect(within(row).queryByText('PMID:5')).not.toBeInTheDocument()
    expect(within(row).getByText('+ 1 more reference(s)')).toBeInTheDocument()
    expect(within(row).getByText('+ 1 more evidence')).toBeInTheDocument()
  })

  it('lets the caller change how many references and evidence items are shown', () => {
    renderTable(
      [
        buildAnnotation({
          evidence: [directEvidence(['PMID:1', 'PMID:2', 'PMID:3']), directEvidence(['PMID:4'])],
        }),
      ],
      { maxReferences: 1, maxEvidences: 1 }
    )

    const [row] = bodyRows()
    expect(within(row).getByText('+ 2 more reference(s)')).toBeInTheDocument()
    expect(within(row).getByText('+ 1 more evidence')).toBeInTheDocument()
    expect(within(row).queryByText('PMID:4')).not.toBeInTheDocument()
  })

  it('opens the clicked annotation in the side panel', async () => {
    const first = buildAnnotation()
    const second = buildAnnotation({
      term: buildCategoryTerm({ id: 'GO:0005215', label: 'transporter activity' }),
      evidence: [directEvidence(['PMID:42'])],
    })
    const { user, store } = renderTable([first, second])

    await user.click(within(bodyRows()[1]).getByText('Paper PMID:42'))

    expect(store.getState().selectedAnnotation.selectedAnnotation).toEqual(second)
    expect(store.getState().drawer.rightDrawerOpen).toBe(true)
  })

  it('skips contributor groups that could not be resolved', () => {
    // The API maps group shorthands through groups.json; unknown ones come back undefined.
    renderTable([
      buildAnnotation({
        detailedGroups: [
          undefined as unknown as Group,
          { id: 'https://www.uniprot.org', label: 'UniProt', shorthand: 'UniProt' },
        ],
      }),
    ])

    const [row] = bodyRows()
    expect(linkByText(row, 'UniProt')).toHaveAttribute('href', 'https://www.uniprot.org')
  })

  it('explains the evidence type behind each annotation on hover', async () => {
    const { user } = renderTable([
      buildAnnotation({ evidenceType: EvidenceType.DIRECT }),
      buildAnnotation({ evidenceType: EvidenceType.HOMOLOGY }),
    ])
    // The evidence icon has no text of its own; it is the first cell's only child.
    const evidenceIcon = (row: HTMLElement) =>
      within(row).getAllByRole('cell', { hidden: true })[0].firstElementChild as HTMLElement

    await user.hover(evidenceIcon(bodyRows()[0]))
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      EVIDENCE_TYPE_MAP[EvidenceType.DIRECT].iconTooltip
    )

    await user.unhover(evidenceIcon(bodyRows()[0]))
    await user.hover(evidenceIcon(bodyRows()[1]))
    expect(
      await screen.findByText(EVIDENCE_TYPE_MAP[EvidenceType.HOMOLOGY].iconTooltip)
    ).toBeInTheDocument()
  })
})
