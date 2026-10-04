import { ASPECT_MAP, AspectType, EvidenceType } from '@/@pango.core/data/config'
import type { Annotation, Evidence, Reference } from '@/features/annotations/models/annotation'
import type { Gene } from '@/features/genes/models/gene'
import type { CategoryTerm, Term } from '@/features/terms/models/term'
import { TermType } from '@/features/terms/models/term'

export const buildTerm = (overrides: Partial<Term> = {}): Term => ({
  id: 'GO:0005515',
  label: 'protein binding',
  displayId: 'GO:0005515',
  aspect: AspectType.MOLECULAR_FUNCTION,
  isGoSlim: false,
  evidenceType: EvidenceType.DIRECT,
  ...overrides,
})

/** A function category as the left-panel graph shows it (colour and shorthand follow the aspect). */
export const buildCategoryTerm = (overrides: Partial<CategoryTerm> = {}): CategoryTerm => {
  const aspect = overrides.aspect ?? AspectType.MOLECULAR_FUNCTION
  return {
    ...buildTerm({
      id: 'GO:0003824',
      label: 'catalytic activity',
      displayId: 'GO:0003824',
      aspect,
      isGoSlim: true,
    }),
    count: 1200,
    color: ASPECT_MAP[aspect].color,
    aspectShorthand: ASPECT_MAP[aspect].shorthand,
    width: '60%',
    countPos: '40%',
    ...overrides,
  }
}

export const buildGene = (overrides: Partial<Gene> = {}): Gene => ({
  gene: 'UniProtKB:P04637',
  geneSymbol: 'TP53',
  geneName: 'Cellular tumor antigen p53',
  namedGene: true,
  longId: 'HUMAN|HGNC=11998|UniProtKB=P04637',
  pantherFamily: 'PTHR11447',
  taxonAbbr: 'HUMAN',
  taxonLabel: 'Homo sapiens',
  taxonId: 'NCBITaxon:9606',
  coordinatesChrNum: '17',
  coordinatesStart: 7661779,
  coordinatesEnd: 7687538,
  coordinatesStrand: -1,
  term: buildTerm(),
  slimTerms: [],
  evidenceType: EvidenceType.DIRECT,
  evidence: [],
  groups: [],
  detailedGroups: [],
  expanded: false,
  maxTerms: 2,
  groupedTerms: { mfs: [], bps: [], ccs: [], maxTerms: 2, expanded: false },
  ...overrides,
})

export const buildReference = (overrides: Partial<Reference> = {}): Reference => ({
  pmid: 'PMID:20959462',
  title: 'p53 and its mutants in tumor cell migration and invasion.',
  date: '2010',
  authors: ['Muller PA', 'Vousden KH'],
  ...overrides,
})

/** Homology evidence from the mouse ortholog; pass `withGeneId: undefined` for direct evidence. */
export const buildEvidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  withGeneId: buildGene({
    gene: 'UniProtKB:P02340',
    geneSymbol: 'Tp53',
    taxonAbbr: 'MOUSE',
    taxonId: 'NCBITaxon:10090',
    taxonLabel: 'Mus musculus',
  }),
  references: [buildReference()],
  ...overrides,
})

/** One TP53 annotation as the gene page receives it (after `detailedGroups` are resolved). */
export const buildAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  gene: 'UniProtKB:P04637',
  geneSymbol: 'TP53',
  geneName: 'Cellular tumor antigen p53',
  namedGene: true,
  longId: 'HUMAN|HGNC=11998|UniProtKB=P04637',
  pantherFamily: 'PTHR11447',
  taxonAbbr: 'HUMAN',
  taxonLabel: 'Homo sapiens',
  taxonId: 'NCBITaxon:9606',
  coordinatesChrNum: '17',
  coordinatesStart: 7661779,
  coordinatesEnd: 7687538,
  coordinatesStrand: -1,
  term: buildTerm(),
  termType: TermType.KNOWN,
  slimTerms: [buildCategoryTerm()],
  evidenceType: EvidenceType.DIRECT,
  evidence: [buildEvidence()],
  groups: ['GO_Central'],
  detailedGroups: [{ id: 'http://geneontology.org', label: 'GO Central', shorthand: 'GO_Central' }],
  ...overrides,
})
