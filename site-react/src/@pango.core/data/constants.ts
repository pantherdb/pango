import type { ApiVersion } from '@/app/store/apiService'
import { ApiVersions } from '@/app/store/apiService'

// Base configuration - shared across all versions
export const BASE_CONFIG = {
  CONTACT_URL:
    'https://docs.google.com/forms/d/e/1FAIpQLScX_caoY-mqsyK5Y6M2bof7EXVG0UY5DhOQ67zBMoAKKlRF4Q/viewform?usp=sharing',
  CONTACT_PREFILL_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScX_caoY-mqsyK5Y6M2bof7EXVG0UY5DhOQ67zBMoAKKlRF4Q/viewform?usp=pp_url',
  AMIGO_TERM_URL: 'http://amigo.geneontology.org/amigo/term/',
  AMIGO_GP_URL: 'http://amigo.geneontology.org/amigo/gene_product/',
  PUBMED_URL: 'https://www.ncbi.nlm.nih.gov/pubmed/',
  TAXON_API_URL: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=',
  UCSC_URL:
    'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&lastVirtModeType=default&lastVirtModeExtraState=&virtModeType=default&virtMode=0&nonVirtPosition=&position=chr',
  OVERREP_API_URL: 'https://enrichment.functionome.org/webservices/go/overrep.jsp',
  UNIPROT_URL: 'https://www.uniprot.org/uniprotkb/',
  AGR_PREFIX_URL: 'https://www.alliancegenome.org/gene/',
  HGNC_PREFIX_URL: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/',
  NCBI_GENE_URL: 'https://www.ncbi.nlm.nih.gov/gene/?term=',
  PAPER_URL: 'https://www.nature.com/articles/s41586-025-08592-0',
  OVERREP_DOCS_API_URL: 'https://geneontology.org/docs/go-enrichment-analysis/',
}

// Version-specific configurations
const VERSION_CONFIGS = {
  [ApiVersions.V1]: {
    PANTREE_URL: 'https://pantree.functionome.org/tree/family.jsp?accession=',
    PANTHER_FAMILY_URL: 'https://enrichment.functionome.org/treeViewer/treeViewer.jsp?',
    // Downloads
    DOWNLOAD_ALL_DATA_CSV_URL: 'https://functionome.geneontology.org/download/export_annotations.zip',
    DOWNLOAD_ALL_DATA_JSON_URL:
      'https://functionome.geneontology.org/download/export_annotations.json.gz',
    DOWNLOAD_ANNOTATIONS_GAF_URL:
      'https://functionome.geneontology.org/download/functionome_release.gaf.gz',
    DOWNLOAD_EVOLUTIONARY_MODELS_GAF_URL: 'https://functionome.geneontology.org/download/IBD.gaf',
    DOWNLOAD_ONTOLOGY_FILES_URL: 'https://release.geneontology.org/2022-03-22/ontology/index.html',

    // Version metadata
    APP_VERSION: '1.0',
    GO_RELEASE: '2022-03-22',
    PANTHER_VERSION: '15.0',
  },

  [ApiVersions.V2]: {
    PANTREE_URL: 'https://pantree.functionome.org/tree/family.jsp?accession=',
    PANTHER_FAMILY_URL: 'https://enrichment.functionome.org/treeViewer/treeViewer.jsp?',
    // Downloads
    DOWNLOAD_ALL_DATA_CSV_URL: 'https://functionome.geneontology.org/download/export_annotations.zip',
    DOWNLOAD_ALL_DATA_JSON_URL:
      'https://functionome.geneontology.org/download/export_annotations.json.gz',
    DOWNLOAD_ANNOTATIONS_GAF_URL:
      'https://functionome.geneontology.org/download/functionome_release.gaf.gz',
    DOWNLOAD_EVOLUTIONARY_MODELS_GAF_URL: 'https://functionome.geneontology.org/download/IBD.gaf',
    DOWNLOAD_ONTOLOGY_FILES_URL: 'https://release.geneontology.org/2022-03-22/ontology/index.html',

    // Version metadata
    APP_VERSION: '2.0',
    GO_RELEASE: '2022-03-22',
    PANTHER_VERSION: '19.0',
  },
}

// Get default version from .env
const DEFAULT_VERSION = (import.meta.env.VITE_PANGO_API_VERSION as ApiVersion) || ApiVersions.V2

export const getConfig = (version: ApiVersion = DEFAULT_VERSION) => ({
  ...BASE_CONFIG,
  ...VERSION_CONFIGS[version],
})

export const getCurrentConfig = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const version = (searchParams.get('apiVersion') as ApiVersion) || DEFAULT_VERSION
  return getConfig(version)
}

// Backward compatibility - default export for current version
export const ENVIRONMENT = getCurrentConfig()
