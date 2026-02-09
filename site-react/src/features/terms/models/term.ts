export enum TermType {
  KNOWN = 'known',
  UNKNOWN = 'unknown',
}

export interface Term {
  id: string
  label: string
  displayId: string
  aspect: string
  isGoSlim: boolean

  // for display
  evidenceType: string

  // Optional for child terms with counts
  count?: number
  color?: string
  aspectShorthand?: string
  width?: string
  countPos?: string
}

export interface CategoryTerm extends Term {
  count: number
  color: string
  aspectShorthand: string
  width: string
  countPos: string
}

export interface GroupedTerms {
  mfs: Term[]
  bps: Term[]
  ccs: Term[]
  maxTerms: number
  expanded: boolean
}

export interface Bucket {
  key: string
  docCount: number
  meta: any
}

export interface Frequency {
  buckets: Bucket[]
}

export interface TermStats {
  termFrequency: Frequency
}
