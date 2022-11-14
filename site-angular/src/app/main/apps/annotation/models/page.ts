import { FilterArgs } from "./annotation";

export class Page {
    size = 0;
    total = 0;
    pageNumber = 0;
}

export class Query {
    source: string[];
    from = 0;
    size = 50;
    filterArgs: FilterArgs = new FilterArgs()
    pageNumber = 0;

}

export class AnnotationPage extends Page {

    query;
    annotations: any;
    aggs: any;

    shallowRefresh() {
        this.pageNumber = 0;
        this.query = undefined;
        this.annotations = undefined;
        this.aggs = undefined;
    }
}
