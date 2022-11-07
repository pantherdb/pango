export class Page {
    size = 0;
    total = 0;
    pageNumber = 0;
}

export class GenePage extends Page {

    query;
    source: string[];
    genes: any;
    aggs: any;
    gene;
    posMin;
    posMax;

    shallowRefresh() {
        this.pageNumber = 0;
        this.query = undefined;
        this.source = undefined;
        this.genes = undefined;
        this.aggs = undefined;
        this.posMin = undefined;
        this.posMax = undefined
    }
}
