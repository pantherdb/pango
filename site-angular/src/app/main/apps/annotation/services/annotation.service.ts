import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { AnnotationPage, Query } from '../models/page';
import { cloneDeep, find, orderBy, uniqBy } from 'lodash';
import { SearchCriteria, SearchType } from '@pango.search/models/search-criteria';
import { AnnotationCount, AnnotationStats, Bucket, FilterArgs, Annotation, AutocompleteFilterArgs, Term } from '../models/annotation';
import { AnnotationGraphQLService } from './annotation-graphql.service';
import { pangoData } from '@pango.common/data/config';
import { Gene } from '../../gene/models/gene.model';

@Injectable({
    providedIn: 'root',
})
export class AnnotationService {
    aspectMap = pangoData.aspectMap;
    termTypeMap = pangoData.termTypeMap;
    annotationResultsSize = environment.annotationResultsSize;
    onGeneCountChanged: BehaviorSubject<number>;
    //onAnnotationGroupsChanged: BehaviorSubject<AnnotationPage>;
    onAnnotationsChanged: BehaviorSubject<AnnotationPage>;
    onAutocompleteChanged: BehaviorSubject<AnnotationPage>;
    onUniqueListChanged: BehaviorSubject<any>;
    onAnnotationsAggsChanged: BehaviorSubject<AnnotationStats>;
    onDistinctAggsChanged: BehaviorSubject<AnnotationStats>;
    onAnnotationChanged: BehaviorSubject<any>;
    onSearchCriteriaChanged: BehaviorSubject<any>;

    onSelectedGeneChanged: BehaviorSubject<Gene>;
    searchCriteria: SearchCriteria;
    annotationPage: AnnotationPage = new AnnotationPage();
    loading = false;
    selectedQuery;
    queryOriginal;
    query: Query = new Query();
    searchType = SearchType.ANNOTATIONS

    private client: Client;
    uniqueList: Annotation[];

    constructor(
        private httpClient: HttpClient,
        private annotationGraphQLService: AnnotationGraphQLService) {
        this.onAnnotationsChanged = new BehaviorSubject(null);
        this.onGeneCountChanged = new BehaviorSubject(null);
        //this.onAnnotationGroupsChanged = new BehaviorSubject(null);
        this.onUniqueListChanged = new BehaviorSubject(null);
        this.onAutocompleteChanged = new BehaviorSubject(null);
        this.onAnnotationsAggsChanged = new BehaviorSubject(null);
        this.onDistinctAggsChanged = new BehaviorSubject(null);
        this.onAnnotationChanged = new BehaviorSubject(null);
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.onSelectedGeneChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();

    }

    private _handleError(error: any) {
        const err = new Error(error);
        return throwError(() => err);
    }


    getAnnotationsExport(page: number): any {
        const self = this;
        self.loading = true;

        this.searchCriteria.clearSearch()
        this.searchCriteria = new SearchCriteria();

        self.getAnnotationsPage(this.query, page);
        self.getAnnotationsCount(this.query);
        self.queryAnnotationStats(this.query);
    }

    getAnnotationsExportAll(): any {
        const self = this;
        self.loading = true;
        return this.annotationGraphQLService.getAnnotationsExportAllQuery(this.query)
    }

    getAnnotationsPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;
        return this.annotationGraphQLService.getAnnotationsQuery(query).subscribe(
            {
                next: (annotations: Annotation[]) => {
                    this.annotationPage = Object.assign(Object.create(Object.getPrototypeOf(this.annotationPage)), this.annotationPage);

                    this.annotationPage.query = query;
                    this.annotationPage.updatePage()
                    this.annotationPage.annotations = annotations;
                    //  this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;


                    this.onAnnotationsChanged.next(this.annotationPage);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getGenesPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;

        return this.annotationGraphQLService.getGenesQuery(query).subscribe(
            {
                next: (genes: Gene[]) => {
                    //const annotationData = annotations
                    this.annotationPage = Object.assign(Object.create(Object.getPrototypeOf(this.annotationPage)), this.annotationPage);
                    this.annotationPage.query = query;
                    this.annotationPage.updatePage()
                    this.annotationPage.annotations = genes;
                    // this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;

                    this.onAnnotationsChanged.next(this.annotationPage);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getAnnotationsExportPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;
        return this.annotationGraphQLService.getAnnotationsQuery(query).subscribe(
            {
                next: (annotations: Annotation[]) => {
                    const annotationData = annotations

                    this.annotationPage.query = query;
                    this.annotationPage.updatePage()
                    this.annotationPage.annotations = annotationData;
                    //  this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;

                    this.onAnnotationsChanged.next(this.annotationPage);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getGenesCount(query: Query): any {
        this.onGeneCountChanged.next(null);
        return this.annotationGraphQLService.getGenesCountQuery(query).subscribe(
            {
                next: (geneCount: AnnotationCount) => {
                    this.annotationPage.total = geneCount.total;
                    this.onGeneCountChanged.next(geneCount.total)
                }, error: (err) => {
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
        this.searchCriteria.updateTooltips()
        this.onSearchCriteriaChanged.next(this.searchCriteria);

        const query = new Query()

        this.searchCriteria.slimTerms.forEach((term: Term) => {
            query.filterArgs.slimTermIds.push(term.id);
        });

        this.searchCriteria.genes.forEach((annotation: Annotation) => {
            query.filterArgs.geneIds.push(annotation.gene);
        });

        this.searchCriteria.aspects.forEach((aspect: string) => {
            query.filterArgs.aspectIds.push(aspect);
        });
        this.searchCriteria.termTypes.forEach((value) => {
            query.filterArgs.termTypeIds.push(value);
        });

        this.searchCriteria.evidenceTypes.forEach((evidenceType: string) => {
            query.filterArgs.evidenceTypeIds.push(evidenceType);
        });


        this.query = query;

        if (this.searchType === SearchType.ANNOTATION_GROUP) {
            this.getGenesPage(query, 1);

        } else {
            this.getAnnotationsPage(query, 1);
            this.getAnnotationsCount(query)
        }
        this.getGenesCount(query)
        this.queryAnnotationStats(query)
        //this.getUniqueItems(query)
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

    buildUnknownTermChart(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            const termType = this.termTypeMap[bucket.key];
            return {
                name: bucket.key,
                label: termType.label,
                value: bucket.docCount,
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }

    buildAnnotationBar(buckets: Bucket[], max = 10, limit = 124) {

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

    buildCategoryBar(buckets: Bucket[]) {

        if (buckets.length === 0) return []

        const sortedBuckets = orderBy(buckets, ['docCount'], ['desc'])
        const longest = sortedBuckets[0].docCount
        const stats = sortedBuckets.map((bucket) => {
            const ratio = bucket.docCount / longest;

            let countPos
            if (ratio < 0.20) {
                countPos = (ratio * 100) + '%';
            } else if (ratio < 0.90) {
                countPos = (ratio - 0.15) * 100 + '%'
            } else {
                countPos = (ratio - 0.30) * 100 + '%'
            }

            return {
                ...bucket.meta,
                name: bucket.key,
                count: bucket.docCount,
                color: this.aspectMap[bucket.meta.aspect]?.color,
                aspectShorthand: this.aspectMap[bucket.meta.aspect]?.shorthand,
                width: (ratio * 100) + '%',
                countPos: countPos

            }
        })

        return stats
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
