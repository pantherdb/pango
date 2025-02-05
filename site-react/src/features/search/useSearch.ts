import { useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'

export const useSearchFilter = () => {
  const search = useAppSelector((state: RootState) => state.search)

  const getQueryFilter = () => ({
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id),
  })

  return {
    filter: getQueryFilter(),
    isEmpty: search.filtersCount === 0,
  }
}
