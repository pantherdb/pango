import { describe, expect, it } from 'vitest'
import { buildAnnotation, buildGene } from '@tests/fixtures/builders'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import {
  getAGRLink,
  getFamilyLink,
  getGeneAccession,
  getHGNC,
  getHGNCLink,
  getNCBIGeneLink,
  getPubmedArticleUrl,
  getUCSCBrowserLink,
  getUniprotLink,
} from '@/@pango.core/services/linksService'

describe('linksService', () => {
  it('extracts the HGNC id from a PANTHER long id', () => {
    expect(getHGNC('HUMAN|HGNC=11998|UniProtKB=P04637')).toBe('HGNC:11998')
    expect(getHGNC('HUMAN|Ensembl=ENSG00000141510|UniProtKB=P04637')).toBeNull()
  })

  it('takes the accession from a prefixed gene id', () => {
    expect(getGeneAccession('UniProtKB:P04637')).toBe('P04637')
    expect(getGeneAccession('P04637')).toBeNull()
    expect(getGeneAccession('')).toBeNull()
  })

  it('links a UniProt entry by accession, falling back to UniProt itself', () => {
    expect(getUniprotLink('UniProtKB:P04637')).toBe(`${ENVIRONMENT.UNIPROT_URL}P04637`)
    expect(getUniprotLink('P04637')).toBe(ENVIRONMENT.UNIPROT_URL)
    expect(getUniprotLink('')).toBe(ENVIRONMENT.UNIPROT_URL)
  })

  it('opens the PANTHER tree viewer at the family and sequence, URL-encoded', () => {
    expect(getFamilyLink(buildAnnotation())).toBe(
      `${ENVIRONMENT.PANTHER_FAMILY_URL}book=PTHR11447&seq=HUMAN%7CHGNC%3D11998%7CUniProtKB%3DP04637`
    )
    expect(getFamilyLink(buildGene({ pantherFamily: '' }))).toBe(ENVIRONMENT.PANTHER_FAMILY_URL)
  })

  it('opens the UCSC genome browser at the gene coordinates', () => {
    expect(getUCSCBrowserLink(buildGene())).toBe(`${ENVIRONMENT.UCSC_URL}17:7661779-7687538`)
    expect(getUCSCBrowserLink(buildGene({ coordinatesChrNum: '' }))).toBe(ENVIRONMENT.UCSC_URL)
  })

  it('links the Alliance and HGNC pages by HGNC id', () => {
    expect(getAGRLink('HGNC:11998')).toBe(`${ENVIRONMENT.AGR_PREFIX_URL}HGNC:11998`)
    expect(getAGRLink('')).toBe(ENVIRONMENT.AGR_PREFIX_URL)
    expect(getHGNCLink('HGNC:11998')).toBe(`${ENVIRONMENT.HGNC_PREFIX_URL}HGNC:11998`)
    expect(getHGNCLink('')).toBe(ENVIRONMENT.HGNC_PREFIX_URL)
  })

  it('searches NCBI Gene for the human gene with that preferred symbol', () => {
    expect(getNCBIGeneLink('TP53')).toBe(
      `${ENVIRONMENT.NCBI_GENE_URL}(TP53%5BPreferred%20Symbol%5D)%20AND%209606%5BTaxonomy%20ID%5D`
    )
    expect(getNCBIGeneLink('')).toBe(ENVIRONMENT.NCBI_GENE_URL)
  })

  it('links a PubMed article by its PMID', () => {
    expect(getPubmedArticleUrl('PMID:20959462')).toBe(`${ENVIRONMENT.PUBMED_URL}20959462`)
    expect(getPubmedArticleUrl('20959462')).toBe(`${ENVIRONMENT.PUBMED_URL}20959462`)
    expect(getPubmedArticleUrl('')).toBe('')
  })
})
