import { Term } from "../../annotation/models/annotation";

export class Gene {
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
  termsSummary: Term[];
  slimTermsSummary: Term[];
  mfs: Term[];
  bps: Term[];
  ccs: Term[];

}