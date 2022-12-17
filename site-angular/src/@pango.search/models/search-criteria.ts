
export enum SearchFilterType {
    TERMS = 'terms',
    SLIM_TERMS = "slimTerms",
    GENES = 'genes',
    ASPECTS = 'aspects',
    QUALIFIERS = 'qualifiers',
    REFERENCES = 'references',
    WITHGENES = 'withgenes',
    EVIDENCE_TYPES = "evidenceTypes"
};

export class GeneFieldGroup {

}

export class SearchCriteria {
    terms: any[] = [];
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
    }


}
