import { getColor } from "@panther.common/data/panther-colors";
import { Gene } from "../../gene/models/gene.model";

export const aspectMap = {
    'molecular function': {
        id: 'molecular function',
        shorthand: 'MF',
        label: 'Molecular Function',
        color: getColor('green', 500)
    },
    'biological process': {
        id: 'biological process',
        shorthand: 'BP',
        label: 'Biological Process',
        color: getColor('orange', 500)
    },
    'cellular component': {
        id: 'cellular component',
        shorthand: 'CC',
        label: 'Cellular Component',
        color: getColor('purple', 500)
    }


}

export const evidenceTypeMap = {
    'direct': {
        id: 'direct',
        label: 'direct',
        color: getColor('green', 500)
    },
    'homology': {
        id: 'homology',
        label: 'homology',
        color: getColor('red', 500)
    },
}








export enum AutocompleteType {
    TERM = 'term',
    GENE = 'gene',
    WITHGENE = "withgene",
    REFERENCE = "reference",
    ASPECT = "aspect",
    RELATION = "relation",
    SLIM_TERM = "slim_term",
    EVIDENCE_TYPE = "evidence_type"
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
            case AutocompleteType.RELATION:
                return `
                    relation
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
    relationIds: string[] = [];
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
    term: Term;
    slimTerms: Term[];
    evidenceType: string;
    evidence: Evidence[] = [];
    relation: string;
    group: string;
}

export class Bucket {
    key: string
    docCount: number
}

export class Frequency {
    buckets: Bucket[]
}

export class AnnotationStats {
    termFrequency: Frequency;
    aspectFrequency: Frequency;
    evidenceTypeFrequency: Frequency;
    slimTermFrequency: Frequency;
}
