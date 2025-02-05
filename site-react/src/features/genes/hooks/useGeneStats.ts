import { useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import { useGetGenesStatsQuery } from '@/features/genes/slices/genesApiSlice'

export const useGeneStats = () => {
  const search = useAppSelector((state: RootState) => state.search)
  const filter = {
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id),
  }

  return useGetGenesStatsQuery({ filter })
}
