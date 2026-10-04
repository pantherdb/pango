import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import {
  buildAnnotation,
  buildCategoryTerm,
  buildEvidence,
  buildGene,
  buildReference,
} from '@tests/fixtures/builders'
import { getConfig } from '@/@pango.core/data/constants'
import type { Annotation } from '@/features/annotations/models/annotation'
import AnnotationCards from '@/features/annotations/components/AnnotationCards'

const config = getConfig()

const mouseEvidence = buildEvidence({
  withGeneId: buildGene({ gene: 'UniProtKB:P02340', geneSymbol: 'Tp53', taxonId: '10090' }),
  references: [buildReference({ pmid: 'PMID:111' })],
})

const directEvidence = (pmids: string[]) =>
  buildEvidence({ withGeneId: undefined, references: pmids.map(pmid => buildReference({ pmid })) })

const renderCards = (annotations: Annotation[], props = {}) =>
  renderWithProviders(<AnnotationCards annotations={annotations} {...props} />)

// Link lookups go through the visible text: name-matching role queries are slow in jsdom.
const linkByText = (text: string) => screen.getByText(text).closest('a')

// jsdom cannot navigate, so link clicks have their default action cancelled; the app's own
// click handlers still run.
const cancelNavigation = (event: MouseEvent) => event.preventDefault()

describe('AnnotationCards', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation, true)
  })

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation, true)
  })

  it('shows each annotation with its term, categories, references and contributors', () => {
    renderCards([buildAnnotation()])

    expect(screen.getByText('MF')).toBeInTheDocument()
    expect(linkByText('protein binding')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0005515`
    )
    expect(linkByText('catalytic activity')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0003824`
    )
    expect(linkByText('PMID:20959462')).toHaveAttribute('href', `${config.PUBMED_URL}20959462`)
    expect(linkByText('GO Central')).toHaveAttribute('href', 'http://geneontology.org')
  })

  it('names the ortholog behind homology evidence', () => {
    renderCards([buildAnnotation({ evidence: [mouseEvidence] })])

    expect(screen.getByText('UniProtKB:P02340 (Tp53)')).toBeInTheDocument()
  })

  it('shows two references and two evidence items, then counts the rest', () => {
    renderCards([
      buildAnnotation({
        evidence: [
          directEvidence(['PMID:1', 'PMID:2', 'PMID:3']),
          directEvidence(['PMID:4']),
          directEvidence(['PMID:5']),
        ],
      }),
    ])

    expect(screen.getByText('PMID:2')).toBeInTheDocument()
    expect(screen.queryByText('PMID:3')).not.toBeInTheDocument()
    expect(screen.getByText('PMID:4')).toBeInTheDocument()
    expect(screen.queryByText('PMID:5')).not.toBeInTheDocument()
    expect(screen.getByText('+ 1 more reference(s)')).toBeInTheDocument()
    expect(screen.getByText('+ 1 more evidence')).toBeInTheDocument()
  })

  it('opens the tapped annotation in the side panel', async () => {
    const second = buildAnnotation({
      term: buildCategoryTerm({ id: 'GO:0005215', label: 'transporter activity' }),
      evidence: [mouseEvidence],
    })
    const { user, store } = renderCards([
      buildAnnotation({ evidence: [directEvidence(['PMID:1'])] }),
      second,
    ])

    await user.click(screen.getByText('UniProtKB:P02340 (Tp53)'))

    expect(store.getState().selectedAnnotation.selectedAnnotation).toEqual(second)
    expect(store.getState().drawer.rightDrawerOpen).toBe(true)
  })

  it('follows reference and contributor links without opening the side panel', async () => {
    const { user, store } = renderCards([buildAnnotation()])

    await user.click(screen.getByText('PMID:20959462'))
    await user.click(screen.getByText('GO Central'))

    expect(store.getState().selectedAnnotation.selectedAnnotation).toBeNull()
    expect(store.getState().drawer.rightDrawerOpen).toBe(false)
  })
})
