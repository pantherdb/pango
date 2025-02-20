import { getColor } from './colors'

export enum AspectType {
  MOLECULAR_FUNCTION = 'molecular function',
  BIOLOGICAL_PROCESS = 'biological process',
  CELLULAR_COMPONENT = 'cellular component',
}

export enum TermType {
  KNOWN = 'known',
  UNKNOWN = 'unknown',
}

export enum EvidenceType {
  DIRECT = 'direct',
  HOMOLOGY = 'homology',
  NA = 'n/a',
}

export interface TermMapType {
  id: string
  label: string
  hint: string
  description: string
  color: string
}

export interface AspectMapType {
  id: string
  icon: string
  shorthand: string
  label: string
  description: string
  color: string
}

export interface EvidenceMapType {
  id: string
  label: string
  hint: string
  description: string
  color: string
  shorthand: string
  iconTooltip: string
}

export const ASPECT_MAP: { [key: string]: AspectMapType } = {
  [AspectType.MOLECULAR_FUNCTION]: {
    id: AspectType.MOLECULAR_FUNCTION,
    icon: 'coverage-4',
    shorthand: 'MF',
    label: 'Molecular Function',
    description: 'What a protein encoded by the gene does at the molecular level',
    color: getColor('lightBlue', 400) || '#000000',
  },
  [AspectType.BIOLOGICAL_PROCESS]: {
    id: AspectType.BIOLOGICAL_PROCESS,
    icon: 'coverage-2',
    shorthand: 'BP',
    label: 'Biological Process',
    description:
      '“System” functions, at the level of the cell or whole organism, that the gene helps to carry out, usually together with other genes',
    color: getColor('orange', 400) || '#000000',
  },
  [AspectType.CELLULAR_COMPONENT]: {
    id: AspectType.CELLULAR_COMPONENT,
    icon: 'coverage-1',
    shorthand: 'CC',
    label: 'Cellular Component',
    description:
      'The part of a cell where a protein encoded by the gene performs its molecular function',
    color: getColor('green', 400) || '#000000',
  },
}

export const TERM_TYPE_MAP: { [key: string]: TermMapType } = {
  [TermType.KNOWN]: {
    id: TermType.KNOWN,
    label: 'Known Aspects',
    hint: 'all',
    description: 'Show only genes of known functions',
    color: getColor('teal', 500) || '#000000',
  },

  [TermType.UNKNOWN]: {
    id: TermType.UNKNOWN,
    label: 'Unknown Aspects',
    hint: '',
    description: 'Show only “placeholder” genes indicating unknown function aspects',
    color: getColor('red', 500) || '#000000',
  },
}

export const EVIDENCE_TYPE_MAP: { [key: string]: EvidenceMapType } = {
  [EvidenceType.DIRECT]: {
    id: EvidenceType.DIRECT,
    label: 'Known Aspects',
    hint: 'direct evidence',
    description: 'Genes supported by experimental evidence directly for that gene',
    color: getColor('green', 700) || '#000000',
    shorthand: 'D',
    iconTooltip:
      'Direct evidence: This characteristic is supported by experimental evidence directly for this gene, and evolutionary modeling including information about related genes',
  },
  [EvidenceType.HOMOLOGY]: {
    id: EvidenceType.HOMOLOGY,
    label: 'Known Aspects',
    hint: 'homology evidence',
    description: 'Genes supported only by experimental evidence for a homologous gene',
    color: getColor('red', 700) || '#000000',
    shorthand: 'H',
    iconTooltip:
      'Homolog evidence: This characteristic is supported by experimental evidence for a homologous gene, using evolutionary modeling.',
  },
  [EvidenceType.NA]: {
    id: EvidenceType.NA,
    label: 'Unknown Aspects',
    hint: 'unknown evidence',
    description:
      'Evidence is not applicable to “placeholder” genes indicating unknown function aspects',
    color: getColor('grey', 700) || '#000000',
    shorthand: 'na',
    iconTooltip: '',
  },
}

export const ASPECT_ORDER: Record<string, number> = {
  'molecular function': 1,
  'biological process': 2,
  'cellular component': 3,
}

interface AnnotationCol {
  label: string
  id: string
  tooltip: string
}

export const ANNOTATION_COLS: AnnotationCol[] = [
  {
    label: 'Gene',
    id: 'gene',
    tooltip: 'Information about the gene and the protein(s) it encodes, and links to more details.',
  },
  {
    label: 'Molecular Functions',
    id: 'mfs',
    tooltip:
      'What a protein encoded by a gene does at the molecular level. Click on a GO identifier for more information about a GO term.',
  },
  {
    label: 'Biological Processes',
    id: 'bps',
    tooltip:
      'System functions, at the level of the cell or whole organism, that the gene helps to carry out. Click on a GO identifier for more information about a GO term.',
  },
  {
    label: 'Cellular Components',
    id: 'ccs',
    tooltip:
      'The part of a cell where the protein encoded by the gene is active. Click on a GO identifier for more information about a GO term.',
  },
]
