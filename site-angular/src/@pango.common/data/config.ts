import { cloneDeep } from "lodash"
import { getColor } from "./pango-colors"

const aspectMap = {
  'molecular function': {
    id: 'molecular function',
    icon: 'coverage-4',
    shorthand: 'MF',
    label: 'Molecular Function',
    description: 'What a protein encoded by the gene does at the molecular level',
    color: getColor('green', 500)
  },
  'biological process': {
    id: 'biological process',
    icon: 'coverage-2',
    shorthand: 'BP',
    label: 'Biological Process',
    description: '“System” functions, at the level of the cell or whole organism, that the gene helps to carry out, usually together with other genes',
    color: getColor('brown', 500)
  },
  'cellular component': {
    id: 'cellular component',
    icon: 'coverage-1',
    shorthand: 'CC',
    label: 'Cellular Component',
    description: 'The part of a cell where a protein encoded by the gene performs its molecular function',
    color: getColor('purple', 500)
  }
}

const termTypeMap = {

  'known': {
    id: 'known',
    label: 'Known Aspects (all)',
    description: "Show only annotations of known functions",
    color: getColor('green', 500)
  },

  'unknown': {
    id: 'unknown',
    label: 'Unknown Aspect',
    description: "Show only “placeholder” annotations indicating unknown function aspects",
    color: getColor('red', 500)
  },
}

const evidenceTypeMap = {
  'direct': {
    id: 'direct',
    label: 'Known Aspects (direct evidence)',
    description: 'Annotations supported by experimental evidence directly for that gene',
    color: getColor('green', 500)
  },
  'homology': {
    id: 'homology',
    label: 'Known Aspects (homology evidence)',
    description: 'Annotations supported only by experimental evidence for a homologous gene',
    color: getColor('red', 500)
  },
  'na': {
    id: 'n/a',
    label: 'n/a',
    description: "Evidence is not applicable to “placeholder” annotations indicating unknown function aspects",
    color: getColor('cyan', 500)
  },
}


export const pangoData = {
  aspectMap: cloneDeep(aspectMap),
  evidenceTypeMap: cloneDeep(evidenceTypeMap),
  termTypeMap: cloneDeep(termTypeMap)
}