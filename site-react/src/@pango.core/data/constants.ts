// Base configuration - shared across all versions
export const BASE_CONFIG = {
  contactUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLScX_caoY-mqsyK5Y6M2bof7EXVG0UY5DhOQ67zBMoAKKlRF4Q/viewform?usp=sharing',
  contactPrefillUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScX_caoY-mqsyK5Y6M2bof7EXVG0UY5DhOQ67zBMoAKKlRF4Q/viewform?usp=pp_url',
  amigoTermUrl: 'http://amigo.geneontology.org/amigo/term/',
  amigoGPUrl: 'http://amigo.geneontology.org/amigo/gene_product/',
  pubmedUrl: 'https://www.ncbi.nlm.nih.gov/pubmed/',
  taxonApiUrl: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=',
  ucscUrl:
    'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&lastVirtModeType=default&lastVirtModeExtraState=&virtModeType=default&virtMode=0&nonVirtPosition=&position=chr',
  pantherFamilyUrl: 'https://enrichment.functionome.org/treeViewer/treeViewer.jsp?',
  overrepApiUrl: 'https://enrichment.functionome.org/webservices/go/overrep.jsp',
  uniprotUrl: 'https://www.uniprot.org/uniprotkb/',
  agrPrefixUrl: 'https://www.alliancegenome.org/gene/',
  hgncPrefixUrl: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/',
  ncbiGeneUrl: 'https://www.ncbi.nlm.nih.gov/gene/?term=',
  pantreeUrl: 'https://pantree.functionome.org/tree/family.jsp?accession=',
}

// Version-specific configurations
const VERSION_CONFIGS = {
  'pango-1': {
    // Downloads
    downloadAllDataCSVUrl: 'https://functionome.geneontology.org/download/export_annotations.zip',
    downloadAllDataJSONUrl:
      'https://functionome.geneontology.org/download/export_annotations.json.gz',
    downloadAnnotationsGAFUrl:
      'https://functionome.geneontology.org/download/functionome_release.gaf.gz',
    downloadEvolutionaryModelsGAFUrl: 'https://functionome.geneontology.org/download/IBD.gaf',
    downloadOntologyFilesUrl: 'https://release.geneontology.org/2022-03-22/ontology/index.html',
    overrepDocsApiUrl: 'https://geneontology.org/docs/go-enrichment-analysis/',
    paperUrl: 'https://www.nature.com/articles/s41586-025-08592-0',

    // Version metadata
    APP_VERSION: '1.0',
    GO_RELEASE: '2022-03-22',
    PANTHER_VERSION: '15.0',
  },

  'pango-2': {
    // Downloads
    downloadAllDataCSVUrl: 'https://functionome.geneontology.org/download/export_annotations.zip',
    downloadAllDataJSONUrl:
      'https://functionome.geneontology.org/download/export_annotations.json.gz',
    downloadAnnotationsGAFUrl:
      'https://functionome.geneontology.org/download/functionome_release.gaf.gz',
    downloadEvolutionaryModelsGAFUrl: 'https://functionome.geneontology.org/download/IBD.gaf',
    downloadOntologyFilesUrl: 'https://release.geneontology.org/2022-03-22/ontology/index.html',
    overrepDocsApiUrl: 'https://geneontology.org/docs/go-enrichment-analysis/',
    paperUrl: 'https://www.nature.com/articles/s41586-025-08592-0',

    // Version metadata
    APP_VERSION: '2.0',
    GO_RELEASE: '2022-03-22',
    PANTHER_VERSION: '19.0',
  },
}

type ApiVersion = 'pango-1' | 'pango-2'

export const getConfig = (version: ApiVersion = 'pango-2') => ({
  ...BASE_CONFIG,
  ...VERSION_CONFIGS[version],
})

export const getCurrentConfig = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const version = (searchParams.get('apiVersion') as ApiVersion) || 'pango-2'
  return getConfig(version)
}

// Backward compatibility - default export for current version
export const ENVIRONMENT = getCurrentConfig()
