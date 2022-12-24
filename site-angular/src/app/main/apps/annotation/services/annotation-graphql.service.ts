import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AnnotationPage, Query } from '../models/page';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { PangoGraphQLService } from '@pango.search/services/graphql.service';
import { AnnotationCount, AnnotationStats, Annotation, AutocompleteFilterArgs, AutocompleteType } from '../models/annotation';

@Injectable({
  providedIn: 'root',
})
export class AnnotationGraphQLService {
  annotationResultsSize = environment.annotationResultsSize;

  onSearchCriteriaChanged: BehaviorSubject<any>;
  searchCriteria: SearchCriteria;
  annotationPage: AnnotationPage = new AnnotationPage();

  constructor(
    private pangoGraphQLService: PangoGraphQLService) {

    this.searchCriteria = new SearchCriteria();

  }

  getAnnotationsQuery(query: Query): Observable<any> {
    const options = {
      variables: {
        filterArgs: query.filterArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs) {
                annotations(filterArgs:$filterArgs) {
                    gene
                    geneName
                    geneSymbol
                    taxonAbbr
                    taxonLabel
                    taxonId
                    qualifier
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
                    evidenceType
                    evidence {
                      withGeneId {
                        gene
                        geneName
                        geneSymbol
                        taxonAbbr
                        taxonLabel
                        taxonId
                      }
                      references {
                        pmid
                        title
                        date
                      }
                    }
                    groups
                                                         
                  }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotations.map(annotation => {
          return annotation
        }) as Annotation[];
      }));
  }


  getAnnotationsCountQuery(query: Query): Observable<any> {

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

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotationsCount as AnnotationCount
      }));

  }

  getUniqueListGraphQL(query: Query): Observable<Annotation[]> {
    const aspectFilter = new AutocompleteFilterArgs(AutocompleteType.ASPECT)
    const qualifierFilter = new AutocompleteFilterArgs(AutocompleteType.QUALIFIER)
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        autocompleteType: aspectFilter.autocompleteType,
        qualifierAutocompleteType: qualifierFilter.autocompleteType,
        keyword: ""
      },
      query: `query GetAutocomplete($autocompleteType:AutocompleteType!,
                $qualifierAutocompleteType:AutocompleteType!,
                 $keyword: String!,
                 $filterArgs: AnnotationFilterArgs) {
                aspect: autocomplete(autocompleteType:$autocompleteType, keyword:$keyword, filterArgs:$filterArgs) {
                   ${aspectFilter.getAutocompleteFields()}                                                  
                }
                qualifier: autocomplete(autocompleteType:$qualifierAutocompleteType, keyword:$keyword, filterArgs:$filterArgs) {
                    ${qualifierFilter.getAutocompleteFields()}                                                  
                 }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.autocomplete.map(annotation => {
          return annotation
        }) as Annotation[];
      }));

  }

  getAutocompleteQuery(query: Query, filter: AutocompleteFilterArgs, keyword: string): Observable<Annotation[]> {
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        autocompleteType: filter.autocompleteType,
        keyword

      },
      query: `query GetAutocomplete($autocompleteType:AutocompleteType!, $keyword: String!, $filterArgs: AnnotationFilterArgs) {
                autocomplete(autocompleteType:$autocompleteType, keyword:$keyword, filterArgs:$filterArgs) {
                ${filter.getAutocompleteFields()}                                                  
                }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
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
                      evidenceTypeFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }
                      slimTermFrequency {
                        buckets {
                          docCount
                          key
                          meta {
                            id
                            aspect
                            label
                          }
                        }
                      }
                  }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.stats as AnnotationStats;
      }));

  }


}
