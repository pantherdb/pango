import type { Annotation } from '@/features/annotations/models/annotation'
import { ENVIRONMENT } from '../data/constants'
import type { Gene } from '@/features/genes/models/gene'

export const getHGNC = (longId: string): string | null => {
  const pattern = /HGNC=(\d+)/
  const matches = longId.match(pattern)

  if (matches && matches.length > 1) {
    return `HGNC:${matches[1]}`
  }

  return null
}

export const getGeneAccession = (gene: string) => {
  if (!gene) return null

  const geneId = gene.split(':')
  return geneId.length > 1 ? geneId[1] : null
}

export const getUniprotLink = (gene: string) => {
  if (!gene) return ENVIRONMENT.UNIPROT_URL

  const geneId = gene.split(':')
  return geneId.length > 1 ? ENVIRONMENT.UNIPROT_URL + geneId[1] : ENVIRONMENT.UNIPROT_URL
}

export const getFamilyLink = (element: Annotation | Gene) => {
  if (!element.pantherFamily || !element.longId) return ENVIRONMENT.PANTHER_FAMILY_URL

  return `${ENVIRONMENT.PANTHER_FAMILY_URL}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`
}

export const getUCSCBrowserLink = (annotation: Annotation | Gene) => {
  if (!annotation.coordinatesChrNum || !annotation.coordinatesStart || !annotation.coordinatesEnd)
    return ENVIRONMENT.UCSC_URL

  return `${ENVIRONMENT.UCSC_URL}${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`
}

export const getAGRLink = (hgncId: string) => {
  if (!hgncId) return ENVIRONMENT.AGR_PREFIX_URL

  return ENVIRONMENT.AGR_PREFIX_URL + hgncId
}

export const getHGNCLink = (hgncId: string) => {
  if (!hgncId) return ENVIRONMENT.HGNC_PREFIX_URL

  return ENVIRONMENT.HGNC_PREFIX_URL + hgncId
}

export const getNCBIGeneLink = (geneSymbol: string) => {
  if (!geneSymbol) return ENVIRONMENT.NCBI_GENE_URL

  return `${ENVIRONMENT.NCBI_GENE_URL}(${geneSymbol}%5BPreferred%20Symbol%5D)%20AND%209606%5BTaxonomy%20ID%5D`
}

export const getPubmedArticleUrl = (pmid: string): string => {
  if (!pmid) return ''
  const id = pmid?.split(':')
  return id.length > 0 ? ENVIRONMENT.PUBMED_URL + id[1] : ''
}
