import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AnnotationPage, Query } from '../models/page';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { PangoGraphQLService } from '@pango.search/services/graphql.service';
import { AnnotationCount, AnnotationStats, Annotation, AutocompleteFilterArgs, AutocompleteType, Term, Group, AnnotationGroup } from '../models/annotation';
import groupsData from '@pango.common/data/groups.json';
import { find } from 'lodash';
import { Gene } from '../../gene/models/gene.model';
import { PangoUtils } from '@pango/utils/pango-utils';
import { pangoData } from '@pango.common/data/config';


@Injectable({
  providedIn: 'root',
})
export class AnnotationGraphQLService {
  aspectMap = pangoData.aspectMap;
  annotationResultsSize = environment.annotationResultsSize;

  onSearchCriteriaChanged: BehaviorSubject<any>;
  searchCriteria: SearchCriteria;
  annotationPage: AnnotationPage = new AnnotationPage();

  constructor(
    private pangoGraphQLService: PangoGraphQLService) {

    this.searchCriteria = new SearchCriteria();

  }

  findGroup(shorthand: string): Group {
    const group = find(groupsData, (group) => {
      return group.shorthand === shorthand;
    }) as Group;

    return group;
  }


  getAnnotationsQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotations(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                    gene
                    geneName
                    geneSymbol
                    longId
                    pantherFamily
                    taxonAbbr
                    taxonLabel
                    taxonId
                    coordinatesChrNum
                    coordinatesStart
                    coordinatesEnd
                    coordinatesStrand
                    term {
                      id
                      aspect
                      isGoslim
                      label
                      displayId
                    } 
                    slimTerms {
                      aspect
                      id
                      isGoslim
                      label
                      displayId
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
                        coordinatesChrNum
                        coordinatesStart
                        coordinatesEnd
                        coordinatesStrand
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
        return response.annotations.map((annotation: Annotation) => {
          annotation.detailedGroups = annotation.groups.map((group) => {
            return this.findGroup(group);
          })
          return annotation
        }) as Annotation[];
      }));
  }


  getGroupedAnnotationsQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
          groupedAnnotations(filterArgs:$filterArgs, pageArgs:$pageArgs) {
            name
            annotations {
              id
              gene
              geneName
              geneSymbol
              longId
              pantherFamily
              taxonAbbr
              taxonLabel
              taxonId
              coordinatesChrNum
              coordinatesStart
              coordinatesEnd
              coordinatesStrand
              term {
                id
                aspect
                isGoslim
                label
                displayId
              } 
              slimTerms {
                aspect
                id
                isGoslim
                label
                displayId
              } 
              evidenceType            
              groups
              evidenceCount             
            }                              
          }
        }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.groupedAnnotations.map((annotationGroup: AnnotationGroup) => {
          let gene: Gene

          if (annotationGroup.annotations.length > 0) {
            gene = { ...annotationGroup.annotations[0] } as unknown as Gene
            const termsSummary = this.getTermsSummary(annotationGroup.annotations)
            gene.mfs = termsSummary['mf']
            gene.bps = termsSummary['bp']
            gene.ccs = termsSummary['cc']
            gene.hgncId = PangoUtils.getHGNC(gene.longId);
            gene.maxTerms = 2;
            gene.expanded = false;
          }

          const annotations = annotationGroup.annotations.map((annotation: Annotation) => {
            annotation.detailedGroups = annotation.groups.map((group) => {
              return this.findGroup(group);
            })
            return annotation
          }) as Annotation[];

          return {
            gene,
            annotations
          }
        }) as AnnotationGroup[];
      }));
  }


  getAnnotationsExportQuery(query: Query): Observable<any> {
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotations(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                    gene
                    geneSymbol
                    term {
                      id
                      label
                    }                                  
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

  getAnnotationsExportAllQuery(query: Query): Observable<any> {
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotationsExport($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotationsExport(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                    data                                 
                  }
                }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotations
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
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        autocompleteType: aspectFilter.autocompleteType,
        keyword: ""
      },
      query: `query GetAutocomplete($autocompleteType:AutocompleteType!,
                 $keyword: String!,
                 $filterArgs: AnnotationFilterArgs) {
                aspect: autocomplete(autocompleteType:$autocompleteType, keyword:$keyword, filterArgs:$filterArgs) {
                   ${aspectFilter.getAutocompleteFields()}                                                  
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

  getSlimTermsAutocompleteQuery(query: Query, keyword: string): Observable<Term[]> {
    const options = {
      variables: {
        filterArgs: query?.filterArgs,
        keyword

      },
      query: `query GetSlimTermAutocomplete($keyword: String!, $filterArgs: AnnotationFilterArgs) {
                slimTermsAutocomplete( keyword:$keyword, filterArgs:$filterArgs) {
                  label
                  id
                  aspect
                  count                                                
                }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.slimTermsAutocomplete.map(term => {
          return term
        }) as Term[];
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
                      distinctGeneCount
                      termTypeFrequency {
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
                            displayId
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

  getTermsSummary(annotations: Annotation[]) {
    const distinctTerms = {
      mf: [],
      bp: [],
      cc: []
    }
    const distinctIds = {
      mf: new Set<string>(),
      bp: new Set<string>(),
      cc: new Set<string>()
    }

    annotations.forEach(annotation => {
      const aspect = this.aspectMap[annotation.term.aspect]?.shorthand.toLowerCase()
      if (aspect && !distinctIds[aspect].has(annotation.term.id)) {
        distinctIds[aspect].add(annotation.term.id);
        annotation.term.evidenceType = annotation.evidenceType

        distinctTerms[aspect].push(annotation.term);
      }
    })

    return distinctTerms;

  }

}


