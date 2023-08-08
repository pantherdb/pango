
export enum SearchType {
    ANNOTATIONS = 'annotations',
    ANNOTATION_GROUP = 'annotations_group'
}
export enum SearchFilterType {
    TERMS = 'terms',
    TERM_TYPES = 'termTypes',
    SLIM_TERMS = "slimTerms",
    GENES = 'genes',
    ASPECTS = 'aspects',
    QUALIFIERS = 'qualifiers',
    REFERENCES = 'references',
    WITHGENES = 'withgenes',
    EVIDENCE_TYPES = "evidenceTypes"
};

export class SearchCriteria {
    terms: any[] = [];
    termTypes: any[] = [];
    slimTerms: any[] = [];
    genes: any[] = [];
    evidenceTypes: any[] = [];
    aspects: any[] = [];
    qualifiers: any[] = [];
    withgenes: any[] = [];
    references: any[] = [];
    fieldValues: any[] = [];

    filtersCount = 0;

    constructor() {
    }

    updateFiltersCount() {
        const self = this;

        self.filtersCount = self.terms.length;
    }

    addAspect() {

    }

    clearSearch() {
        this.terms = [];
        this.genes = []
        this.termTypes = [];
        this.slimTerms = [];
        this.genes = [];
        this.evidenceTypes = [];
        this.aspects = [];
        this.qualifiers = [];
        this.withgenes = [];
        this.references = [];
        this.fieldValues = [];
    }


}
