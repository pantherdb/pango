import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
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
import { FiInfo, FiX } from 'react-icons/fi'

const Home: React.FC = () => {
  const dispatch = useAppDispatch()
  const [isFormOpen, setIsFormOpen] = useState(false)

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
        className="relative min-w-0 bg-gradient-to-r from-[#00174f] to-[rgba(0,23,79,0.5)] bg-cover bg-top 
          p-4 md:p-5 md:pt-10 h-auto md:h-[350px] py-6 md:py-0"
        style={{
          backgroundImage: `linear-gradient(to right, #00174f, rgba(0,23,79,0.8), rgba(0,23,79,0.5)), url('/assets/images/gene.jpeg')`,
        }}
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-0">
          <div className="w-full md:w-3/5 flex-col">
            <h1 className="mb-4 text-2xl md:text-5xl font-bold tracking-wider text-white">
              Functions of Human Genes
            </h1>
            <h2 className="mb-10 max-w-2xl text-sm md:text-lg font-medium leading-7 tracking-wider text-white">
              The table below shows, for each human protein-coding gene, the set of functional
              characteristics that have been assigned based on expert review and integration of
              available experimental evidence in 6,333 families of protein-coding genes. ({' '}
              <Link to="/about" className="text-accent-500 hover:text-accent-200">
                {' '}
                Read More
              </Link>{' '}
              ). Each characteristic is linked to the experimental evidence supporting it.
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-white text-sm md:text-base">
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
          <div className="w-full md:w-2/5 p-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center text-xs md:text-sm font-medium text-white">
                PAN-GO Enrichment Analysis
                <FiInfo className="ml-2" />
              </h2>
              {isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-white hover:text-accent-200 md:hidden"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>

            {/* Mobile view with collapsible form */}
            <div className="md:hidden">
              {!isFormOpen ? (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-2 w-full p-3 text-left text-white/70 border border-white/30 rounded hover:border-white/50"
                >
                  Click to perform enrichment analysis...
                </button>
              ) : (
                <div className="mt-2">
                  <OverrepForm />
                </div>
              )}
            </div>

            {/* Desktop view with always visible form */}
            <div className="hidden md:block">
              <OverrepForm />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 flex h-[30px] items-center bg-white px-3 shadow-md overflow-x-auto">
        <FilterSummary />
      </div>

      <Box className="mb-[200px] min-h-[500px] px-2 md:px-0">
        <Genes />
      </Box>
    </Box>
  )
}

export default Home