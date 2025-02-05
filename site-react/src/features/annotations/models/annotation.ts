import type { Gene } from '@/features/genes/models/gene'
import type { Term, TermType } from '@/features/terms/models/term'

export enum GOAspect {
  MOLECULAR_FUNCTION = 'molecular function',
  BIOLOGICAL_PROCESS = 'biological process',
  CELLULAR_COMPONENT = 'cellular component',
}

export enum AutocompleteType {
  GENE = 'gene',
  SLIM_TERM = 'slim_term',
}

export interface UniqueAnnotations {
  aspect: string
}
export interface AutocompleteFilterArgs {
  autocompleteType: AutocompleteType
}

export interface GeneFilterArgs {
  termIds: string[]
  slimTermIds: string[]
}

export interface FilterArgs {
  termIds: string[]
  termTypeIds: string[]
  slimTermIds: string[]
  evidenceTypeIds: string[]
  geneIds: string[]
  aspectIds: string[]
  withGeneIds: string[]
  referenceIds: string[]
}

export interface AnnotationCount {
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
  withGeneId: Gene
  references: Reference[]
}

export interface Annotation {
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
  termType: TermType
  slimTerms: Term[]
  evidenceType: string
  evidence: Evidence[]
  groups: string[]
  detailedGroups: Group[]
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

export interface AnnotationStats {
  distinctGeneCount: number
  termFrequency: Frequency
  termTypeFrequency: Frequency
  aspectFrequency: Frequency
  evidenceTypeFrequency: Frequency
  slimTermFrequency: Frequency
}

export interface AnnotationsApiResponse {
  annotations: Annotation[]
}
