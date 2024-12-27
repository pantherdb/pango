export interface Gene {
  gene: string
  geneSymbol: string
  geneName: string
  longId: string;
  pantherFamily: string;
  taxonAbbr: string;
  taxonLabel: string;
  taxonId: string;
  coordinatesChrNum: string
  coordinatesStart: number
  coordinatesEnd: number
  coordinatesStrand: number
  hgncId: string;
  //summary
  terms: Term[];
  slimTerms: Term[];
  mfs: Term[];
  bps: Term[];
  ccs: Term[];

  expanded: boolean;
  maxTerms: number;
}