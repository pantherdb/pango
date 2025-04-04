// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  annotationResultsSize: 50,
  pangoGraphQLUrl: 'http://34.235.126.222/api/graphql', //'http://localhost:5000/graphql',//'https://functionome.geneontology.org/api/graphql',
  amigoTermUrl: "http://amigo.geneontology.org/amigo/term/",
  amigoGPUrl: "http://amigo.geneontology.org/amigo/gene_product/",
  pubmedUrl: "https://www.ncbi.nlm.nih.gov/pubmed/",
  taxonApiUrl: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=',

  ucscUrl: 'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&lastVirtModeType=default&lastVirtModeExtraState=&virtModeType=default&virtMode=0&nonVirtPosition=&position=chr',
  pantherFamilyUrl: 'https://www.pantherdb.org/treeViewer/treeViewer.jsp?',
  overrepApiUrl: 'https://enrichment.functionome.org/webservices/go/overrep.jsp',
  //overrepApiUrl: 'https://pantherdb.org/webservices/go/overrep.jsp',

  uniprotUrl: 'https://www.uniprot.org/uniprotkb/',
  agrPrefixUrl: 'https://www.alliancegenome.org/gene/',
  hgncPrefixUrl: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/'
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
