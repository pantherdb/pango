import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { GenePage } from '../models/page';
import { cloneDeep, find, orderBy, uniqBy } from 'lodash';
import { SearchCriteria } from '@panther.search/models/search-criteria';
import { ScardGraphQLService } from '@panther.search/services/graphql.service';
import { AnnotationStats, Bucket, FilterArgs, Gene } from '../models/gene';

@Injectable({
    providedIn: 'root',
})
export class GeneService {
    geneResultsSize = environment.geneResultsSize;
    onGenesChanged: BehaviorSubject<GenePage>;
    onGenesAggsChanged: BehaviorSubject<AnnotationStats>;
    onDistinctAggsChanged: BehaviorSubject<AnnotationStats>;
    onGeneChanged: BehaviorSubject<any>;
    onSearchCriteriaChanged: BehaviorSubject<any>;
    searchCriteria: SearchCriteria;
    genePage: GenePage = new GenePage();
    loading = false;
    selectedQuery;
    queryOriginal;
    query;

    private client: Client;

    constructor(
        private httpClient: HttpClient,
        private scardGraphQLService: ScardGraphQLService) {
        this.onGenesChanged = new BehaviorSubject(null);
        this.onGenesAggsChanged = new BehaviorSubject(null);
        this.onDistinctAggsChanged = new BehaviorSubject(null);
        this.onGeneChanged = new BehaviorSubject(null);
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();

    }

    private _handleError(error: any) {
        const err = new Error(error);
        return throwError(() => err);
    }


    getGenesQuery(filter: FilterArgs): Observable<any> {
        const self = this;

        const options = {
            variables: {
                filter
            },
            query: `query GetAnnotations {
                annotations {
                    gene
                    term
                    reference
                }
            }`
        }

        return self.scardGraphQLService.query(options).pipe(
            map((response: any) => {
                return response.annotations.map(gene => {
                    return gene
                }) as Gene[];
            }));

    }

    getGenesAggsQuery(filter: FilterArgs): Observable<any> {
        const self = this;

        const options = {
            variables: {
                filter
            },
            query: `query GetAnnotationsStats {
                    stats {
                      termsFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }
                  }
            }`
        }

        return self.scardGraphQLService.query(options).pipe(
            map((response: any) => {
                return response.stats as AnnotationStats;
            }));

    }

    getGenes(page: number): any {
        const self = this;
        self.loading = true;

        let headers = uniqBy(['chr', 'pos', 'ref', 'alt', 'rs_dbGENE151'], (header) => {
            return header;
        });

        this.searchCriteria.clearSearch()
        this.searchCriteria = new SearchCriteria();

        const query: any = {
            '_source': headers
        };

        const aggs = {}

        self.setOriginalQuery(query)
        self.getGenesPage(query, page);
        // self.getGenesCount(query);
    }

    setOriginalQuery(query) {
        this.queryOriginal = cloneDeep(query)
        this.queryOriginal.from = 0;
        this.queryOriginal.size = this.geneResultsSize;
    }


    getGenesPage(query: any, page: number): any {
        const self = this;
        self.loading = true;
        query.from = (page - 1) * this.geneResultsSize;
        query.size = this.geneResultsSize;
        this.query = query;
        return this.getGenesQuery(null).subscribe(
            {
                next: (genes: Gene[]) => {
                    const geneData = genes

                    this.genePage.query = query;
                    this.genePage.size = self.geneResultsSize;
                    this.genePage.genes = geneData;
                    //  this.genePage.aggs = response.aggregations;
                    this.genePage.source = query._source;

                    this.onGenesChanged.next(this.genePage);
                    console.log(this.genePage)

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getGenesCount(query: any): any {
        const self = this;
        this.query = query;
        return this.client.count({
            body: { query: query.query }
        }).then((res) => {
            if (res?.count) {
                this.genePage.total = res.count;
            }
        }, (err) => {
            console.warn(err);
        });
    }

    queryAnnotationStats(field?: string): any {
        const self = this;
        //console.log(query);
        return this.getGenesAggsQuery(null).subscribe(
            {
                next: (stats) => {

                    const annotationStats = stats as AnnotationStats

                    this.onGenesAggsChanged.next(annotationStats);

                }, error: (err) => {
                    console.warn(err);
                }
            });
    }

    queryDistinctAggs(query: any, field: string): any {
        const self = this;
        query.size = 0;
        //console.log(query);
        this.onDistinctAggsChanged.next(null);
        return this.client.search({
            body: {
                query: query.query,
                size: query.size,
                aggs: query.aggs
            }
        }).then((body) => {
            if (body.aggregations) {
                const annotationStats = new AnnotationStats();

                // annotationStats.field = field;
                // annotationStats.aggs = body.aggregations;
                this.onDistinctAggsChanged.next(annotationStats);
            } else {
                this.onDistinctAggsChanged.next(null);
            }
        }, (err) => {
            console.warn(err);
        });
    }

    updateSearch() {
        this.searchCriteria.updateFiltersCount();
        this.onSearchCriteriaChanged.next(this.searchCriteria);
        if (this.queryOriginal?.query?.bool?.filter) {
            const query = cloneDeep(this.queryOriginal)

            this.searchCriteria.fields.forEach((field: any) => {
                query.query.bool.filter.push(
                    {
                        "exists": {
                            "field": field.name
                        }
                    });
            });

            //for advanced search
            /*         const filters = this.searchCriteria.fieldValues.map((filedValueArray) => {
                        return {
                            'bool': {
                                "should": filedValueArray.map((field) => {
                                    const annotation = this.annotationService.findDetailByName(field.name);
                                    let fieldSearchable = field.name;
        
                                    if (annotation.field_type === ColumnFieldType.TEXT) {
                                        fieldSearchable += '.keyword';
                                    }
                                    return {
                                        'term': { [fieldSearchable]: field.value }
                                    };
                                })
                            }
                        };
                    });
        
                    query.query.bool['must'] = filters */

            this.getGenesPage(query, 1);
            this.getGenesCount(query)
        }
    }

    buildSummaryTree(aggs) {

        const treeNodes = aggs.map((agg) => {
            const children = [
                {
                    name: agg.name,
                    label: "With Values",
                    count: agg.count
                }
            ]

            return {
                id: agg.name,
                label: agg.label,
                count: agg.count,
                name: agg.name,
                isCategory: true,
                children: children
            }
        })


        return treeNodes;
    }

    buildAnnotationBar(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }


    buildAnnotationLine(buckets: Bucket[], name) {

        const series = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })


        return [{
            name,
            series
        }]
    }

    buildPosHistogramLine(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }


}
