import { getColor } from "@pango.common/data/pango-colors";
import { Gene } from "../../gene/models/gene.model";

export enum GOAspect {
    MOLECULAR_FUNCTION = 'molecular function',
    BIOLOGICAL_PROCESS = 'biological process',
    CELLULAR_COMPONENT = 'cellular component'
}

export enum AutocompleteType {
    GENE = 'gene',
    SLIM_TERM = "slim_term",
}

export class UniqueAnnotations {
    aspect: string
}
export class AutocompleteFilterArgs {

    constructor(autocompleteType = AutocompleteType.GENE) {
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
            case AutocompleteType.SLIM_TERM:
                return `
                    slimTerms {
                        aspect
                        id
                        label
                      } 
                    `
        }
    }
}

export class GeneFilterArgs {
    termIds: string[] = [];
    slimTermIds: string[] = [];
}

export class FilterArgs {
    termIds: string[] = [];
    termTypeIds: string[] = [];
    slimTermIds: string[] = [];
    evidenceTypeIds: string[] = [];
    geneIds: string[] = [];
    aspectIds: string[] = [];
    withGeneIds: string[] = [];
    referenceIds: string[] = [];
}

export class AnnotationCount {
    total = 0;
}

export class Group {
    label: string
    id: string
    shorthand: string
}

export class Term {
    id: string;
    label: string;
    displayId: string;
    aspect: string;
    isGoSlim: boolean;

    // for display
    evidenceType

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
    groups: string[] = [];
    detailedGroups: Group[] = [];
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
    termTypeFrequency: Frequency;
    aspectFrequency: Frequency;
    evidenceTypeFrequency: Frequency;
    slimTermFrequency: Frequency;
}
