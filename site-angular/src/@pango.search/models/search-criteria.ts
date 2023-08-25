
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
    REFERENCES = 'references',
    WITHGENES = 'withgenes',
    EVIDENCE_TYPES = "evidenceTypes"
};

export class SearchCriteria {
    slimTermsTooltip = ''
    geneTooltip = ''
    aspectsTooltip = ''

    terms: any[] = [];
    termTypes: any[] = [];
    slimTerms: any[] = [];
    genes: any[] = [];
    evidenceTypes: any[] = [];
    aspects: any[] = [];
    withgenes: any[] = [];
    references: any[] = [];
    fieldValues: any[] = [];

    filtersCount = 0;

    constructor() {
    }

    updateTooltips() {

        this.slimTermsTooltip = this.slimTerms.map((term => {
            return `${term.label}(${term.id})`
        })).join('\n')

        this.geneTooltip = this.slimTerms.map((item => {
            return `${item.geneSymbol} (${item.gene})\n${item.geneName}`
        })).join('\n')

        this.aspectsTooltip = this.slimTerms.map((aspect => {
            return `${aspect.label}`
        })).join('\n')
    }

    updateFiltersCount() {
        const self = this;

        self.filtersCount = self.slimTerms.length + self.genes.length + self.aspects.length;
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
        this.withgenes = [];
        this.references = [];
        this.fieldValues = [];
    }


}
