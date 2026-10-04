/**
 * A dataset's figures against the same dataset in another build, usually the previous one.
 *
 * Relative imports only (see parse.ts).
 */

export type Change = 'same' | 'up' | 'down' | 'new' | 'gone' | 'absent'

export interface FigureDelta {
  key: string
  label: string
  previous: number | null
  current: number | null
  delta: number | null
  /** The change as a percentage of the previous figure; null when there was none. */
  pct: number | null
  change: Change
  /** A change of at least LARGE_CHANGE_PCT, or a figure that appeared or vanished. */
  large: boolean
}

/** A change this large in a key figure is worth a look. Tune it on real releases. */
export const LARGE_CHANGE_PCT = 10

/** The report's figures that say what a dataset holds, in reading order. */
export const KEY_FIGURES: readonly (readonly [string, string])[] = [
  ['annotations', 'Annotations'],
  ['genes', 'Genes'],
  ['go_terms', 'GO terms annotated'],
  ['slim_terms', 'Slim terms'],
  ['genes_named', 'Named genes'],
  ['genes_unnamed', 'Unnamed genes'],
  ['annotations_unknown_term', 'Unknown-term annotations'],
  ['genes_with_unknown_terms', 'Genes with unknown terms'],
  ['evidence', 'Evidence lines'],
  ['references', 'References'],
  ['references_unresolved', 'PMIDs without an article'],
  ['with_genes', 'With-genes'],
  ['groups', 'Contributing groups'],
  ['input_terms', 'Terms in the ontology'],
  ['input_genes', 'Genes in the gene info'],
]

/** The figures the "large change" findings watch. */
export const WATCHED_FIGURES = [
  'annotations',
  'genes',
  'go_terms',
  'slim_terms',
  'references',
  'with_genes',
]

export function compareFigure(
  key: string,
  label: string,
  current: number | null,
  previous: number | null
): FigureDelta {
  if (current === null && previous === null) {
    return { key, label, previous, current, delta: null, pct: null, change: 'absent', large: false }
  }
  if (previous === null) {
    return { key, label, previous, current, delta: null, pct: null, change: 'new', large: false }
  }
  if (current === null) {
    return { key, label, previous, current, delta: null, pct: null, change: 'gone', large: true }
  }
  const delta = current - previous
  const pct = previous === 0 ? null : (100 * delta) / previous
  const change: Change = delta === 0 ? 'same' : delta > 0 ? 'up' : 'down'
  const large = pct === null ? delta !== 0 : Math.abs(pct) >= LARGE_CHANGE_PCT
  return { key, label, previous, current, delta, pct, change, large }
}

export function compareFigures(
  current: Record<string, number>,
  previous: Record<string, number> | null,
  figures: readonly (readonly [string, string])[] = KEY_FIGURES
): FigureDelta[] {
  return figures
    .map(([key, label]) =>
      compareFigure(key, label, current[key] ?? null, previous ? (previous[key] ?? null) : null)
    )
    .filter(row => row.change !== 'absent')
}

export interface BreakdownDelta {
  key: string
  previous: number | null
  current: number | null
  delta: number | null
}

/** Every key either build has, largest now first; keys that appeared or vanished show as such. */
export function compareBreakdown(
  current: Record<string, number>,
  previous: Record<string, number> | null
): BreakdownDelta[] {
  const keys = new Set([...Object.keys(current), ...Object.keys(previous ?? {})])
  return [...keys]
    .map(key => {
      const now = current[key] ?? null
      const before = previous ? (previous[key] ?? null) : null
      return {
        key,
        previous: before,
        current: now,
        delta: now !== null && before !== null ? now - before : null,
      }
    })
    .sort((a, b) => (b.current ?? -1) - (a.current ?? -1) || a.key.localeCompare(b.key))
}
