import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
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
import theme from '@/@pango.core/theme/theme'
import GeneSearch from '@/features/genes/components/GeneSearch'

const Home: React.FC = () => {
  const dispatch = useAppDispatch()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
    dispatch(setLeftDrawerOpen(!isMobile))
  }, [dispatch, isMobile])

  return (
    <Box className="flex w-full flex-col">
      <div
        className="relative h-auto min-w-0 bg-gradient-to-r from-[#00174f] to-[rgba(0,23,79,0.5)] bg-cover bg-top p-3 py-4 md:p-5 md:pt-10"
        style={{
          backgroundImage: `linear-gradient(to right, #00174f, rgba(0,23,79,0.8), rgba(0,23,79,0.5)), url('/assets/images/gene.jpeg')`,
        }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:gap-0">
          <div className="w-full flex-col md:w-3/5">
            <h1 className="mb-2 text-xl font-bold leading-5 tracking-wider text-white md:text-4xl">
              Functions of Human Genes
            </h1>
            <h2 className="mb-2 max-w-2xl pr-4 text-sm font-medium tracking-wider text-white md:text-sm md:mb-10 md:leading-6">
              The functionome describes the known functions of all human protein-coding genes, using
              terms from the Gene Ontology to describe each functional characteristic (
              <Link to="/about" className="text-accent-500 hover:text-accent-200">
                read more
              </Link>
              ). Detailed information for a gene can be found by clicking on the gene name in the
              table below, or by using the search box to find a specific gene. The interactive
              graph/filter shows how the genes in the table are distributed among functional
              categories and can be used to browse genes by category (
              <Link to="/help" className="text-accent-500 hover:text-accent-200">
                more help
              </Link>
              ).
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mb-1 mt-4 w-full md:hidden">
                <GeneSearch isOpen={true} />
              </div>
              <h3 className="text-xs text-white md:text-base">
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
          <div className="mt-1 w-full md:w-2/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm mb-2 flex items-center font-medium text-white md:text-base">
                PAN-GO Enrichment Analysis
                <a
                  href={ENVIRONMENT.overrepDocsApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1 text-accent-500 hover:text-accent-200"
                >
                  <FiInfo className="ml-2 text-2xl" />
                </a>
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
                  className="mt-1 w-full rounded border border-white/30 p-3 text-left text-white/70 hover:border-white/50"
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

      <div className="sticky top-0 z-10 flex h-[30px] items-center overflow-x-auto bg-white px-3 shadow-md">
        <FilterSummary />
      </div>

      <Box className="mb-[200px] min-h-[500px] px-2 md:px-0">
        <Genes />
      </Box>
    </Box>
  )
}

export default Home
