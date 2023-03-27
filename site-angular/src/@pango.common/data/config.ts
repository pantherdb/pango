import { cloneDeep } from "lodash"
import { getColor } from "./pango-colors"

const aspectMap = {
  'molecular function': {
    id: 'molecular function',
    shorthand: 'MF',
    label: 'Molecular Function (MF)',
    description: 'What a protein encoded by the gene does at the molecular level',
    color: getColor('green', 500)
  },
  'biological process': {
    id: 'biological process',
    shorthand: 'BP',
    label: 'Biological Process (BP)',
    description: '“System” functions, at the level of the cell or whole organism, that the gene helps to carry out, usually together with other genes',
    color: getColor('orange', 500)
  },
  'cellular component': {
    id: 'cellular component',
    shorthand: 'CC',
    label: 'Cellular Component (CC)',
    description: 'The part of a cell where a protein encoded by the gene performs its molecular function',
    color: getColor('purple', 500)
  }


}

const evidenceTypeMap = {
  'direct': {
    id: 'direct',
    label: 'direct',
    description: 'Annotations supported by experimental evidence directly for that gene',
    color: getColor('green', 500)
  },
  'homology': {
    id: 'homology',
    label: 'homology',
    description: 'Annotations supported only by experimental evidence for a homologous gene',
    color: getColor('red', 500)
  },
  'na': {
    id: 'n/a',
    label: 'n/a',
    description: '',
    color: getColor('cyan', 500)
  },
}


export const pangoData = {
  aspectMap: cloneDeep(aspectMap),
  evidenceTypeMap: cloneDeep(evidenceTypeMap)
}