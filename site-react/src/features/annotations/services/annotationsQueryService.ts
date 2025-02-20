import { gql } from '@apollo/client'
import { print } from 'graphql'

export const GET_ANNOTATIONS_QUERY = print(gql`
  query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
    annotations(filterArgs: $filterArgs, pageArgs: $pageArgs) {
      gene
      geneName
      geneSymbol
      longId
      pantherFamily
      taxonAbbr
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
      termType
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
          taxonId
          taxonLabel
          coordinatesChrNum
          coordinatesStart
          coordinatesEnd
          coordinatesStrand
        }
        references {
          pmid
          title
          date
          authors
        }
      }
      groups
    }
  }
`)

export const GET_ANNOTATIONS_COUNT_QUERY = print(gql`
  query GetAnnotationsCount($filterArgs: AnnotationFilterArgs) {
    annotationsCount(filterArgs: $filterArgs) {
      total
    }
  }
`)

export const GET_SLIM_TERMS_AUTOCOMPLETE_QUERY = print(gql`
  query GetSlimTermAutocomplete($keyword: String!, $filterArgs: AnnotationFilterArgs) {
    slimTermsAutocomplete(keyword: $keyword, filterArgs: $filterArgs) {
      label
      id
      aspect
      count
      displayId
    }
  }
`)

export const GET_ANNOTATION_STATS_QUERY = print(gql`
  query GetAnnotationsStats($filterArgs: AnnotationFilterArgs) {
    annotationStats(filterArgs: $filterArgs) {
      termTypeFrequency {
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
  }
`)
