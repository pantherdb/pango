import { getColor } from "./colors";

export interface TermType {
  id: string;
  label: string;
  hint: string;
  description: string;
  color: string | null;
}

export interface AspectType {
  id: string;
  icon: string;
  shorthand: string;
  label: string;
  description: string;
  color: string | null;
}

export interface EvidenceType {
  id: string;
  label: string;
  hint: string;
  description: string;
  color: string | null;
  shorthand: string;
  iconTooltip: string;
}

export const ASPECT_MAP: { [key: string]: AspectType } = {
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

export const TERM_TYPE_MAP: { [key: string]: TermType } = {

  'known': {
    id: 'known',
    label: 'Known Aspects',
    hint: 'all',
    description: "Show only genes of known functions",
    color: getColor('green', 500)
  },

  'unknown': {
    id: 'unknown',
    label: 'Unknown Aspects',
    hint: '',
    description: "Show only “placeholder” genes indicating unknown function aspects",
    color: getColor('red', 500)
  },
}

export const EVIDENCE_TYPE_MAP: { [key: string]: EvidenceType } = {
  'direct': {
    id: 'direct',
    label: 'Known Aspects',
    hint: 'direct evidence',
    description: 'Genes supported by experimental evidence directly for that gene',
    color: getColor('green', 500),
    shorthand: 'D',
    iconTooltip: 'Direct evidence: This characteristic is supported by experimental evidence directly for this gene, and evolutionary modeling including information about related genes'
  },
  'homology': {
    id: 'homology',
    label: 'Known Aspects',
    hint: 'homology evidence',
    description: 'Genes supported only by experimental evidence for a homologous gene',
    color: getColor('red', 500),
    shorthand: 'H',
    iconTooltip: 'Homolog evidence: This characteristic is supported by experimental evidence for a homologous gene, using evolutionary modeling.'

  },
  'n/a': {
    id: 'n/a',
    label: 'Unknown Aspects',
    hint: 'unknown evidence',
    description: "Evidence is not applicable to “placeholder” genes indicating unknown function aspects",
    color: getColor('cyan', 500),
    shorthand: 'na',
    iconTooltip: ''
  },
}

export const ASPECT_ORDER = {
  'molecular function': 1,
  'biological process': 2,
  'cellular component': 3
};