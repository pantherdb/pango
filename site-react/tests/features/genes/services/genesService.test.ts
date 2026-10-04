import { describe, expect, it } from 'vitest'
import { buildAnnotation, buildTerm } from '@tests/fixtures/builders'
import { AspectType, EvidenceType } from '@/@pango.core/data/config'
import { transformGenes, transformTerms } from '@/features/genes/services/genesService'

const mf = buildTerm({
  id: 'GO:0003700',
  label: 'DNA-binding transcription factor activity',
  aspect: AspectType.MOLECULAR_FUNCTION,
})
const bp = buildTerm({
  id: 'GO:0006915',
  label: 'apoptotic process',
  aspect: AspectType.BIOLOGICAL_PROCESS,
})
const cc = buildTerm({ id: 'GO:0005634', label: 'nucleus', aspect: AspectType.CELLULAR_COMPONENT })

const ids = (terms: { id: string }[]) => terms.map(term => term.id)

describe('transformTerms', () => {
  it("groups annotated terms by GO aspect, each carrying its annotation's evidence type", () => {
    const grouped = transformTerms([
      buildAnnotation({ term: mf, evidenceType: EvidenceType.DIRECT }),
      buildAnnotation({ term: bp, evidenceType: EvidenceType.HOMOLOGY }),
      buildAnnotation({ term: cc, evidenceType: EvidenceType.NA }),
    ])

    expect(grouped.mfs).toEqual([{ ...mf, evidenceType: EvidenceType.DIRECT }])
    expect(grouped.bps).toEqual([{ ...bp, evidenceType: EvidenceType.HOMOLOGY }])
    expect(grouped.ccs).toEqual([{ ...cc, evidenceType: EvidenceType.NA }])
  })

  it('matches aspects case-insensitively and leaves out terms with an unknown aspect', () => {
    const grouped = transformTerms([
      buildAnnotation({ term: { ...mf, aspect: 'Molecular Function' } }),
      buildAnnotation({ term: { ...bp, aspect: 'not an aspect' } }),
    ])

    expect(ids(grouped.mfs)).toEqual(['GO:0003700'])
    expect(grouped.bps).toEqual([])
    expect(grouped.ccs).toEqual([])
  })

  it('shows two terms per aspect, collapsed, unless asked for more', () => {
    expect(transformTerms([])).toEqual({ mfs: [], bps: [], ccs: [], maxTerms: 2, expanded: false })
    expect(transformTerms([buildAnnotation()], 150).maxTerms).toBe(150)
  })
})

describe('transformGenes', () => {
  it("groups each gene's terms by aspect and keeps the gene's own fields", () => {
    const second = { ...mf, id: 'GO:0005515', label: 'protein binding' }

    const [gene] = transformGenes([
      { gene: 'UniProtKB:P04637', geneSymbol: 'TP53', terms: [mf, bp, cc, second] },
    ])

    expect(gene.geneSymbol).toBe('TP53')
    expect(ids(gene.groupedTerms.mfs)).toEqual(['GO:0003700', 'GO:0005515'])
    expect(ids(gene.groupedTerms.bps)).toEqual(['GO:0006915'])
    expect(ids(gene.groupedTerms.ccs)).toEqual(['GO:0005634'])
    expect(gene.groupedTerms).toMatchObject({ maxTerms: 2, expanded: false })
  })

  it('treats a gene the API returned without terms as having none', () => {
    const [gene] = transformGenes([{ gene: 'UniProtKB:Q00000', geneSymbol: 'NOTERMS' }])

    expect(gene.groupedTerms).toEqual({ mfs: [], bps: [], ccs: [], maxTerms: 2, expanded: false })
  })

  it('leaves the API response untouched', () => {
    const apiGene = { gene: 'UniProtKB:Q00000', geneSymbol: 'NOTERMS' }

    const [gene] = transformGenes([apiGene])

    expect(apiGene).not.toHaveProperty('terms')
    expect(gene).toHaveProperty('terms', [])
  })
})
