import { cloneDeep } from "lodash"
import { getColor } from "./pango-colors"

const aspectMap = {
  'molecular function': {
    id: 'molecular function',
    shorthand: 'MF',
    label: 'Molecular Function',
    color: getColor('green', 500)
  },
  'biological process': {
    id: 'biological process',
    shorthand: 'BP',
    label: 'Biological Process',
    color: getColor('orange', 500)
  },
  'cellular component': {
    id: 'cellular component',
    shorthand: 'CC',
    label: 'Cellular Component',
    color: getColor('purple', 500)
  }


}

const evidenceTypeMap = {
  'direct': {
    id: 'direct',
    label: 'direct',
    color: getColor('green', 500)
  },
  'homology': {
    id: 'homology',
    label: 'homology',
    color: getColor('red', 500)
  },
}


export const pangoData = {
  aspectMap: cloneDeep(aspectMap),
  evidenceTypeMap: cloneDeep(evidenceTypeMap)
}