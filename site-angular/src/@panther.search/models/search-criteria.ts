
export enum SearchFilterType {
    TERMS = 'terms',
    GENES = 'genes',
    ASPECTS = 'aspects',
    RELATIONS = 'relations',
    REFERENCES = 'references',
    WITHGENES = 'withgenes'
};

export class GeneFieldGroup {

}

export class SearchCriteria {
    terms: any[] = [];
    genes: any[] = [];
    aspects: any[] = [];
    relations: any[] = [];
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

    clearSearch() {
        this.terms = [];
        this.genes = []
    }


}
