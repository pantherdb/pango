import { FilterArgs } from "./annotation";

export class PageArgs {
    page = 0;
    size = 50;
}

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
    pageArgs = new PageArgs()
    pageNumber = 0;

}

export class AnnotationPage extends Page {

    query;
    annotations: any;
    aggs: any;

    updatePage() {
        this.pageNumber = this.query.pageArgs.page;
        this.size = this.query.pageArgs.size;
    }


}


