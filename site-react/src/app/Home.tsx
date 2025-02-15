import type React from 'react'
import { useEffect, useMemo } from 'react'
import { Box } from '@mui/material'
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import OverrepForm from '@/features/genes/components/forms/OverrepForm'
import Genes from '@/features/genes/components/Genes'
import { useAppDispatch, useAppSelector } from './hooks'
import FilterSummary from '@/features/search/components/FilterSummary'
import type { RootState } from './store/store'
import { useGetGenesStatsQuery } from '@/features/genes/slices/genesApiSlice'
import { transformCategoryTerms } from '@/features/terms/services/termsService'
import { setFunctionCategories } from '@/features/terms/slices/termsSlice'
import { Link } from 'react-router-dom'
import { ENVIRONMENT } from '@/@pango.core/data/constants'

const Home: React.FC = () => {
  const dispatch = useAppDispatch()

  const search = useAppSelector((state: RootState) => state.search)
  const filter = useMemo(
    () => ({
      geneIds: search.genes.map(g => g.gene),
      slimTermIds: search.slimTerms.map(t => t.id),
    }),
    [search.genes, search.slimTerms]
  )

  const { data: statsData, isSuccess } = useGetGenesStatsQuery({ filter })

  useEffect(() => {
    if (isSuccess && statsData) {
      const categoryTerms = transformCategoryTerms(statsData.slimTermFrequency?.buckets || [])
      dispatch(setFunctionCategories(categoryTerms))
    }
  }, [statsData, isSuccess, dispatch])

  useEffect(() => {
    dispatch(setLeftDrawerOpen(true))
  }, [dispatch])

  return (
    <Box className="flex w-full flex-col">
      <div
        className="relative h-[350px] max-h-[400px] min-w-[800px] bg-gradient-to-r from-[#00174f] to-[rgba(0,23,79,0.5)] bg-cover bg-top p-5 pt-10"
        style={{
          backgroundImage: `linear-gradient(to right, #00174f, rgba(0,23,79,0.8), rgba(0,23,79,0.5)), url('/assets/images/gene.jpeg')`,
        }}
      >
        <div className="flex">
          <div className="w-3/5 flex-col">
            <h1 className="mb-4 text-5xl font-bold tracking-wider text-white">
              Functions of Human Genes
            </h1>
            <h2 className="mb-10 max-w-2xl text-lg font-medium leading-7 tracking-wider text-white">
              The table below shows, for each human protein-coding gene, the set of functional
              characteristics that have been assigned based on expert review and integration of
              available experimental evidence in 6,333 families of protein-coding genes. ({' '}
              <Link to="/about" className="text-accent-500 hover:text-accent-200">
                {' '}
                Read More
              </Link>{' '}
              ). Each characteristic is linked to the experimental evidence supporting it.
            </h2>
            <div className="flex items-center">
              {/*     <div className="mr-4 w-[300px]">
                <GeneForm />
              </div> */}

              <h3 className="text-white">
                See any missing or incorrect functions?
                <a
                  href={ENVIRONMENT.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1 text-accent-500 hover:text-accent-200"
                >
                  Let us know!
                </a>
              </h3>
            </div>
          </div>
          <div className="w-2/5 p-3">
            <h2 className="text-sm font-medium text-white">
              PAN-GO Enrichment Analysis
              <span className="ml-2">ⓘ</span>
            </h2>
            <OverrepForm />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 flex h-[30px] items-center bg-white px-3 shadow-md">
        <FilterSummary />
      </div>

      <Box className="mb-[200px] min-h-[500px]">
        <Genes />
      </Box>
    </Box>
  )
}

export default Home
