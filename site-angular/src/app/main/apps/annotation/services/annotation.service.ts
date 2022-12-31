import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { AnnotationPage, Query } from '../models/page';
import { cloneDeep, find, orderBy, uniqBy } from 'lodash';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { AnnotationCount, AnnotationStats, Bucket, FilterArgs, Annotation, AutocompleteFilterArgs, Term } from '../models/annotation';
import { AnnotationGraphQLService } from './annotation-graphql.service';
import { pangoData } from '@pango.common/data/config';

@Injectable({
    providedIn: 'root',
})
export class AnnotationService {
    aspectMap = pangoData.aspectMap;
    annotationResultsSize = environment.annotationResultsSize;
    onAnnotationsChanged: BehaviorSubject<AnnotationPage>;
    onAutocompleteChanged: BehaviorSubject<AnnotationPage>;
    onUniqueListChanged: BehaviorSubject<any>;
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
    uniqueList: Annotation[];

    constructor(
        private httpClient: HttpClient,
        private annotationGraphQLService: AnnotationGraphQLService) {
        this.onAnnotationsChanged = new BehaviorSubject(null);
        this.onUniqueListChanged = new BehaviorSubject(null);
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
        return this.annotationGraphQLService.getAnnotationsQuery(query).subscribe(
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
        return this.annotationGraphQLService.getAnnotationsCountQuery(query).subscribe(
            {
                next: (annotationCount: AnnotationCount) => {
                    this.annotationPage.total = annotationCount.total;
                }, error: (err) => {
                }
            });
    }

    getAutocompleteQuery(filter: AutocompleteFilterArgs, keyword: string): Observable<Annotation[]> {
        return this.annotationGraphQLService.getAutocompleteQuery(this.query, filter, keyword)
    }

    getSlimTermsAutocompleteQuery(keyword: string): Observable<Term[]> {
        return this.annotationGraphQLService.getSlimTermsAutocompleteQuery(new Query, keyword)
    }

    getUniqueItems(query: Query): any {
        return this.annotationGraphQLService.getUniqueListGraphQL(query).subscribe(
            {
                next: (annotations: Annotation[]) => {
                    this.uniqueList = annotations;
                }, error: (err) => {
                }
            });
    }


    queryAnnotationStats(query: Query): any {
        return this.annotationGraphQLService.getAnnotationsAggsQuery(query).subscribe(
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

        this.searchCriteria.evidenceTypes.forEach((evidenceType: string) => {
            query.filterArgs.evidenceTypeIds.push(evidenceType);
        });

        this.searchCriteria.slimTerms.forEach((term: Term) => {
            query.filterArgs.slimTermIds.push(term.id);
        });

        this.searchCriteria.genes.forEach((annotation: Annotation) => {
            query.filterArgs.geneIds.push(annotation.gene);
        });

        this.searchCriteria.qualifiers.forEach((annotation: Annotation) => {
            query.filterArgs.qualifierIds.push(annotation.qualifier);
        });

        this.searchCriteria.aspects.forEach((aspect: string) => {
            query.filterArgs.aspectIds.push(aspect);
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

        this.query = query;

        this.getAnnotationsPage(query, 1);
        this.getAnnotationsCount(query)
        this.queryAnnotationStats(query)
        this.getUniqueItems(query)
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
            const aspect = this.aspectMap[bucket.key];
            return {
                name: bucket.key,
                label: aspect.label,
                value: bucket.docCount,
                extra: aspect
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }

    buildAnnotationBar(buckets: Bucket[], max = 10, limit = 20) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount,
                extra: bucket.meta
            }
        })

        if (stats.length < max) {
            for (let i = 0; i < max - stats.length; i++) {
                stats.push({
                    name: ' '.repeat(i + 1),
                    value: 0,
                    extra: {}
                })
            }
        }

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted.slice(0, limit)
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
