import type { Term, GroupedTerms } from '@/features/terms/models/term'

export enum GOAspect {
  MOLECULAR_FUNCTION = 'molecular function',
  BIOLOGICAL_PROCESS = 'biological process',
  CELLULAR_COMPONENT = 'cellular component',
}

export enum AutocompleteType {
  GENE = 'gene',
  SLIM_TERM = 'slim_term',
}

export interface AutocompleteFilterArgs {
  autocompleteType: AutocompleteType
}

export interface GeneFilterArgs {
  geneIds: string[]
  slimTermIds: string[]
}

export interface FilterArgs {
  slimTermIds: string[]
  geneIds: string[]
}

export interface GeneCount {
  total: number
}

export interface Group {
  label: string
  id: string
  shorthand: string
}

export interface Reference {
  pmid: string
  title: string
  authors: string[]
  date: string
}

export interface Evidence {
  with_gene_ids: Gene
  reference: Reference[]
}

export interface Gene {
  gene: string
  geneSymbol: string
  geneName: string
  longId: string
  pantherFamily: string
  taxonAbbr: string
  taxonLabel: string
  taxonId: string
  coordinatesChrNum: string
  coordinatesStart: number
  coordinatesEnd: number
  coordinatesStrand: number
  term: Term
  slimTerms: Term[]
  evidenceType: string
  evidence: Evidence[]
  groups: string[]
  detailedGroups: Group[]
  expanded: boolean
  maxTerms: number

  // derived
  groupedTerms: GroupedTerms
}

export interface Bucket {
  key: string
  docCount: number
  meta: any
}

export interface Frequency {
  buckets: Bucket[]
}

export interface GeneStats {
  slimTermFrequency: Frequency
}

export interface GeneStats {
  distinctGeneCount: number
  termFrequency: Frequency
  termTypeFrequency: Frequency
  aspectFrequency: Frequency
  evidenceTypeFrequency: Frequency
  slimTermFrequency: Frequency
}

export interface GenesApiResponse {
  genes: Gene[]
}
