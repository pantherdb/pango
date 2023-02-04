import { getColor } from "@pango.common/data/pango-colors";
import { Gene } from "../../gene/models/gene.model";









export enum AutocompleteType {
    TERM = 'term',
    GENE = 'gene',
    WITHGENE = "withgene",
    REFERENCE = "reference",
    ASPECT = "aspect",
    QUALIFIER = "qualifier",
    SLIM_TERM = "slim_term",
    EVIDENCE_TYPE = "evidence_type"
}

export class UniqueAnnotations {
    aspect: string
    qualifier: string
}
export class AutocompleteFilterArgs {

    constructor(autocompleteType = AutocompleteType.TERM) {
        this.autocompleteType = autocompleteType;
    }
    autocompleteType: AutocompleteType;

    getAutocompleteFields() {
        switch (this.autocompleteType) {
            case AutocompleteType.GENE:
                return `
                    gene
                    geneSymbol
                    geneName
                `
            case AutocompleteType.TERM:
                return `
                    term {
                        id
                        aspect
                        label
                    }
                `
            case AutocompleteType.SLIM_TERM:
                return `
                    slimTerms {
                        aspect
                        id
                        label
                      } 
                    `
            case AutocompleteType.EVIDENCE_TYPE:
                return `
                            evidenceType
                        `
            case AutocompleteType.ASPECT:
                return `
                    term {
                        aspect
                    }
                `
            case AutocompleteType.QUALIFIER:
                return `
                    qualifier
                `
            case AutocompleteType.REFERENCE:
                return `
                    evidence {
                        reference {
                            pmid
                            title
                            date
                        }
                    }
                `
            case AutocompleteType.WITHGENE:
                return `
                    evidence {
                        withGeneId {
                            gene
                            geneSymbol
                            geneName
                        }
                    }
                `
        }
    }
}

export class FilterArgs {
    termIds: string[] = [];
    slimTermIds: string[] = [];
    evidenceTypeIds: string[] = [];
    geneIds: string[] = [];
    aspectIds: string[] = [];
    qualifierIds: string[] = [];
    withGeneIds: string[] = [];
    referenceIds: string[] = [];
}

export class AnnotationCount {
    total = 0;
}

export class Term {
    id: string;
    label: string;
    aspect: string;
    isGoSlim: boolean;
}

export class Reference {
    pmid: string;
    title: string;
    authors: string[] = [];
    date: string;
}

export class Evidence {
    with_gene_ids: Gene;
    reference: Reference[] = [];
}

export class Annotation {
    gene: string;
    geneSymbol: string;
    geneName: string;
    longId: string;
    pantherFamily: string;
    taxonAbbr: string;
    taxonLabel: string;
    taxonId: string;
    coordinatesChrNum: string
    coordinatesStart: number
    coordinatesEnd: number
    coordinatesStrand: number
    term: Term;
    slimTerms: Term[];
    evidenceType: string;
    evidence: Evidence[] = [];
    qualifier: string;
    groups: string[] = [];
}

export class Bucket {
    key: string
    docCount: number
    meta: any
}

export class Frequency {
    buckets: Bucket[]
}

export class AnnotationStats {
    distinctGeneCount: number;
    termFrequency: Frequency;
    aspectFrequency: Frequency;
    evidenceTypeFrequency: Frequency;
    slimTermFrequency: Frequency;
}
