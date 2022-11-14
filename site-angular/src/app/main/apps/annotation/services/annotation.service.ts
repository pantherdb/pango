import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { AnnotationPage, Query } from '../models/page';
import { cloneDeep, find, orderBy, uniqBy } from 'lodash';
import { SearchCriteria } from '@panther.search/models/search-criteria';
import { ScardGraphQLService } from '@panther.search/services/graphql.service';
import { AnnotationCount, AnnotationStats, Bucket, FilterArgs, Annotation, aspectMap, AutocompleteFilterArgs } from '../models/annotation';

@Injectable({
    providedIn: 'root',
})
export class AnnotationService {
    annotationResultsSize = environment.annotationResultsSize;
    onAnnotationsChanged: BehaviorSubject<AnnotationPage>;
    onAutocompleteChanged: BehaviorSubject<AnnotationPage>;
    onAnnotationsAggsChanged: BehaviorSubject<AnnotationStats>;
    onDistinctAggsChanged: BehaviorSubject<AnnotationStats>;
    onAnnotationChanged: BehaviorSubject<any>;
    onSearchCriteriaChanged: BehaviorSubject<any>;
    searchCriteria: SearchCriteria;
    annotationPage: AnnotationPage = new AnnotationPage();
    loading = false;
    selectedQuery;
    queryOriginal;
    query: Query = new Query();

    private client: Client;

    constructor(
        private httpClient: HttpClient,
        private scardGraphQLService: ScardGraphQLService) {
        this.onAnnotationsChanged = new BehaviorSubject(null);
        this.onAutocompleteChanged = new BehaviorSubject(null);
        this.onAnnotationsAggsChanged = new BehaviorSubject(null);
        this.onDistinctAggsChanged = new BehaviorSubject(null);
        this.onAnnotationChanged = new BehaviorSubject(null);
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();

    }

    private _handleError(error: any) {
        const err = new Error(error);
        return throwError(() => err);
    }


    getAnnotationsQuery(query: Query): Observable<any> {
        const self = this;

        const options = {
            variables: {
                filterArgs: query.filterArgs
            },
            query: `query GetAnnotations($filterArgs: AnnotationFilterArgs) {
                annotations(filterArgs:$filterArgs) {
                    gene
                    geneName
                    geneSymbol
                    term {
                      id
                      aspect
                      isGoslim
                      label
                    } 
                    slimTerms {
                      aspect
                      id
                      isGoslim
                      label
                    }  
                    evidence {
                      withGeneId {
                        gene
                        geneName
                        geneSymbol
                      }
                      references {
                        pmid
                        title
                        date
                      }
                    }
                    group
                    qualifier
                                     
                  }
            }`
        }

        return self.scardGraphQLService.query(options).pipe(
            map((response: any) => {
                return response.annotations.map(annotation => {
                    return annotation
                }) as Annotation[];
            }));

    }


    getAnnotationsCountQuery(query: Query): Observable<any> {
        const self = this;

        const options = {
            variables: {
                filterArgs: query.filterArgs
            },
            query: `query GetAnnotationsCount($filterArgs: AnnotationFilterArgs) {
                annotationsCount(filterArgs:$filterArgs) {
                    total                                     
                  }
            }`
        }

        return self.scardGraphQLService.query(options).pipe(
            map((response: any) => {
                return response.annotationsCount as AnnotationCount
            }));

    }

    getAutocompleteQuery(filter: AutocompleteFilterArgs, keyword: string): Observable<Annotation[]> {
        const self = this;

        const options = {
            variables: {
                autocompleteType: filter.autocompleteType,
                keyword

            },
            query: `query GetAutocomplete($autocompleteType:AutocompleteType!, $keyword: String!) {
                autocomplete(autocompleteType:$autocompleteType, keyword:$keyword) {
                ${filter.getAutocompleteFields()}                                                  
                }
            }`
        }

        return self.scardGraphQLService.query(options).pipe(
            map((response: any) => {
                return response.autocomplete.map(annotation => {
                    return annotation
                }) as Annotation[];
            }));

    }

    getAnnotationsAggsQuery(query: Query): Observable<any> {
        const self = this;

        const options = {
            variables: {
                filterArgs: query.filterArgs
            },
            query: `query GetAnnotationsStats($filterArgs: AnnotationFilterArgs) {
                    stats(filterArgs:$filterArgs) {
                      termFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }
                      aspectFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }
                      qualifierFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }
                      referencesFrequency {
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

    getAnnotations(page: number): any {
        const self = this;
        self.loading = true;

        this.searchCriteria.clearSearch()
        this.searchCriteria = new SearchCriteria();

        self.getAnnotationsPage(this.query, page);
        self.getAnnotationsCount(this.query);
        self.queryAnnotationStats(this.query);
    }

    getAnnotationsPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.from = (page - 1) * this.annotationResultsSize;
        query.size = this.annotationResultsSize;
        this.query = query;
        return this.getAnnotationsQuery(query).subscribe(
            {
                next: (annotations: Annotation[]) => {
                    const annotationData = annotations

                    this.annotationPage.query = query;
                    this.annotationPage.size = self.annotationResultsSize;
                    this.annotationPage.annotations = annotationData;
                    //  this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;

                    this.onAnnotationsChanged.next(this.annotationPage);
                    console.log(this.annotationPage)

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getAnnotationsCount(query: Query): any {
        return this.getAnnotationsCountQuery(query).subscribe(
            {
                next: (annotationCount: AnnotationCount) => {
                    this.annotationPage.total = annotationCount.total;
                }, error: (err) => {
                }
            });
    }


    queryAnnotationStats(query: Query): any {
        return this.getAnnotationsAggsQuery(query).subscribe(
            {
                next: (stats) => {
                    const annotationStats = stats as AnnotationStats
                    this.onAnnotationsAggsChanged.next(annotationStats);
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

        const query = new Query()

        this.searchCriteria.terms.forEach((annotation: Annotation) => {
            query.filterArgs.termIds.push(annotation.term.id);
        });

        this.searchCriteria.genes.forEach((annotation: Annotation) => {
            query.filterArgs.geneIds.push(annotation.gene);
        });

        this.searchCriteria.qualifiers.forEach((annotation: Annotation) => {
            query.filterArgs.qualifierIds.push(annotation.qualifier);
        });

        this.searchCriteria.aspects.forEach((annotation: Annotation) => {
            query.filterArgs.aspectIds.push(annotation.term.aspect);
        });

        this.searchCriteria.withgenes.forEach((annotation: Annotation) => {
            // query.filterArgs.withgeneIds.push(annotation.evidence);
        });

        this.searchCriteria.references.forEach((annotation: Annotation) => {
            // query.filterArgs.references.push(annotation.reference);
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

        this.getAnnotationsPage(query, 1);
        this.getAnnotationsCount(query)
        this.queryAnnotationStats(query)
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

    buildAspectChart(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            return {
                name: aspectMap[bucket.key]?.label,
                value: bucket.docCount
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }

    buildAnnotationBar(buckets: Bucket[], max = 10) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })

        if (stats.length < max) {
            for (let i = 0; i < max - stats.length; i++) {
                stats.push({
                    name: ' '.repeat(i + 1),
                    value: 0
                })
            }
        }

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
