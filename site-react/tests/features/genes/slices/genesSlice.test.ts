import { describe, expect, it } from 'vitest'
import { geneSlice, resetFilterArgs, setFilterArgs } from '@/features/genes/slices/genesSlice'

describe('genesSlice', () => {
  it('merges new filter arguments into the current ones and resets them', () => {
    const initial = geneSlice.getInitialState()
    expect(initial.filterArgs).toEqual({ geneIds: [], slimTermIds: [], termIds: [] })

    const filtered = geneSlice.reducer(
      geneSlice.reducer(initial, setFilterArgs({ geneIds: ['UniProtKB:P04637'] })),
      setFilterArgs({ termIds: ['GO:0005515'] })
    )
    expect(filtered.filterArgs).toEqual({
      geneIds: ['UniProtKB:P04637'],
      slimTermIds: [],
      termIds: ['GO:0005515'],
    })

    expect(geneSlice.reducer(filtered, resetFilterArgs()).filterArgs).toEqual(initial.filterArgs)
  })
})
