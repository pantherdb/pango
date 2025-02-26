import { gql } from '@apollo/client'
import { print } from 'graphql'

export const GET_ANNOTATIONS_QUERY = print(gql`
  query GetGenes($filterArgs: GeneFilterArgs, $pageArgs: PageArgs) {
    genes(filterArgs: $filterArgs, pageArgs: $pageArgs) {
      gene
      geneName
      geneSymbol
      longId
      pantherFamily
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
  }
`)

export const GET_GENES_QUERY = print(gql`
  query GetGenes($filterArgs: GeneFilterArgs, $pageArgs: PageArgs) {
    genes(filterArgs: $filterArgs, pageArgs: $pageArgs) {
      gene
      geneName
      geneSymbol
      longId
      pantherFamily
      coordinatesChrNum
      coordinatesStart
      coordinatesEnd
      coordinatesStrand
      terms {
        id
        aspect
        label
        displayId
        evidenceType
      }
      slimTerms {
        aspect
        id
        label
        displayId
      }
    }
  }
`)

export const GET_ANNOTATIONS_COUNT_QUERY = print(gql`
  query GetGenesCount($filterArgs: GeneFilterArgs) {
    genesCount(filterArgs: $filterArgs) {
      total
    }
  }
`)

export const GET_GENES_COUNT_QUERY = print(gql`
  query GetGenesCount($filterArgs: GeneFilterArgs) {
    genesCount(filterArgs: $filterArgs) {
      total
    }
  }
`)

export const GET_AUTOCOMPLETE_QUERY = print(gql`
  query GetAutocomplete(
    $autocompleteType: AutocompleteType!
    $keyword: String!
    $filterArgs: GeneFilterArgs
  ) {
    autocomplete(autocompleteType: $autocompleteType, keyword: $keyword, filterArgs: $filterArgs) {
      gene
      geneName
      geneSymbol
    }
  }
`)

export const GET_GENES_STATS_QUERY = print(gql`
  query GetGenesStats($filterArgs: GeneFilterArgs) {
    geneStats(filterArgs: $filterArgs) {
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
