import type { Annotation } from '@/features/annotations/models/annotation'
import type { GroupedTerms } from '@/features/terms/models/term'
import type { Gene } from '../models/gene'
import { GOAspect } from '../models/gene'

const groupTermsByAspect = (terms: any[]) => {
  return terms.reduce((acc, term) => {
    const aspect = term.aspect?.toLowerCase()
    if (!acc[aspect]) {
      acc[aspect] = []
    }
    acc[aspect].push(term)
    return acc
  }, {})
}

export const transformTerms = (annotations: Annotation[], maxTerms = 2): GroupedTerms => {
  const terms = annotations.map((annotation: Annotation) => {
    return {
      ...annotation.term,
      evidenceType: annotation.evidenceType,
    }
  })

  const grouped = groupTermsByAspect(terms)
  return {
    mfs: grouped[GOAspect.MOLECULAR_FUNCTION] || [],
    bps: grouped[GOAspect.BIOLOGICAL_PROCESS] || [],
    ccs: grouped[GOAspect.CELLULAR_COMPONENT] || [],
    maxTerms,
    expanded: false,
  }
}

export const transformGenes = (genes: any[]): Gene[] => {
  return genes.map(gene => {
    if (!gene.terms) {
      gene.terms = []
    }
    const grouped = groupTermsByAspect(gene.terms)

    const groupedTerms: GroupedTerms = {
      mfs: grouped[GOAspect.MOLECULAR_FUNCTION] || [],
      bps: grouped[GOAspect.BIOLOGICAL_PROCESS] || [],
      ccs: grouped[GOAspect.CELLULAR_COMPONENT] || [],
      maxTerms: 2,
      expanded: false,
    }
    return {
      ...gene,
      groupedTerms,
    }
  })
}
