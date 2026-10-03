import type React from 'react'
import { FaCaretRight, FaCaretDown } from 'react-icons/fa'
import { setPage, setPageSize } from '@/features/search/searchSlice'
import { useMemo, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import type { Gene } from '../models/gene'
import { useGetGenesQuery, useGetGenesCountQuery } from '../slices/genesApiSlice'
import type { RootState } from '@/app/store/store'
import Terms from '@/features/terms/components/Terms'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { ANNOTATION_COLS } from '@/@pango.core/data/config'
import GeneCard from './GeneCard'
import { getUniprotLink, getUCSCBrowserLink } from '@/@pango.core/services/linksService'
import {
  selectLeftDrawerOpen,
  setLeftDrawerOpen,
} from '@/@pango.core/components/drawer/drawerSlice'
import { handleExternalLinkClick } from '@/analytics'
import { ActionIcon, Button, Loader, Select, Tooltip } from '@mantine/core'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useMediaQuery } from '@mantine/hooks'
import RenameTabDialog from '@/shared/components/RenameTabDialog'

const Genes: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 599.99px)')
  const isLeftDrawerOpen = useAppSelector((state: RootState) => selectLeftDrawerOpen(state))
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [tabName, setTabName] = useState('PAN-GO Results')

  const { page, size } = useAppSelector((state: RootState) => state.search.pagination)
  const search = useAppSelector((state: RootState) => state.search)
  const dispatch = useAppDispatch()

  const filter = useMemo(
    () => ({
      geneIds: search.genes.map(g => g.gene),
      slimTermIds: search.slimTerms.map(t => t.id),
      termIds: search.terms.map(t => t.id),
    }),
    [search.genes, search.slimTerms, search.terms]
  )

  const { data: geneData, isLoading, error } = useGetGenesQuery({ page, size, filter })
  const { data: countData } = useGetGenesCountQuery({ filter })

  const genes = geneData?.genes ?? []
  const geneCount = countData?.total || 0
  const totalPages = Math.max(1, Math.ceil(geneCount / size))

  const handleExpandClick = (gene: Gene) => {
    setExpandedRows(prev => ({
      ...prev,
      [gene.gene]: !prev[gene.gene],
    }))
  }

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRowsPerPageChange = (value: string | null) => {
    if (!value) return
    dispatch(setPageSize(parseInt(value, 10)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-600/40">
        <Loader />
      </div>
    )
  }

  if (error) return <div>Error loading genes</div>

  const pageStart = page * size + 1
  const pageEnd = Math.min((page + 1) * size, geneCount)

  return (
    <div className="w-full pt-3 p-1 md:p-3">
      <div className="w-fill mb-6 flex h-20 items-center rounded-t-2xl bg-white pr-3">
        <h2 className="flex-1 pl-3 text-xl font-medium text-gray-600 sm:text-3xl">
          Results (<strong>{geneCount}</strong>) <small>genes</small>
        </h2>

        {!isLeftDrawerOpen && (
          <Button
            variant="outline"
            size="sm"
            className="min-w-[100px] rounded-md !bg-accent-200"
            onClick={() => dispatch(setLeftDrawerOpen(true))}
          >
            Open Filter
          </Button>
        )}
      </div>

      <RenameTabDialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        currentName={tabName}
        onRename={setTabName}
      />

      {isMobile ? (
        <div className="space-y-2">
          {genes.map((gene: Gene) => (
            <GeneCard key={gene.gene} gene={gene} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-10 p-3"></th>
                  {ANNOTATION_COLS.map(col => (
                    <th key={col.id} className="p-3 text-left">
                      <Tooltip openDelay={1500} position="top" label={col.tooltip} withArrow>
                        <span>{col.label}</span>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {genes.map((gene: Gene) => (
                  <tr key={gene.gene} className="border-b border-gray-300">
                    <td className="p-3 pt-6">
                      <button
                        onClick={() => handleExpandClick(gene)}
                        className="text-lg text-gray-700"
                      >
                        {expandedRows[gene.gene] ? <FaCaretDown /> : <FaCaretRight />}
                      </button>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1 text-sm">
                        <div className="text-lg font-bold">
                          <VersionedLink
                            to={`/gene/${gene.gene}`}
                            className=""
                            target="_blank"
                            rel="noreferrer"
                          >
                            {gene.geneSymbol}
                          </VersionedLink>
                        </div>
                        <div className="text-gray-600">{gene.geneName}</div>
                        <div>
                          <a
                            href={getUniprotLink(gene.gene)}
                            onClick={() => handleExternalLinkClick(getUniprotLink(gene.gene))}
                            className=""
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {gene?.gene}
                          </a>
                        </div>
                        {gene.coordinatesChrNum && (
                          <div className="text-sm text-gray-500">
                            UCSC Browser:
                            <a
                              className="ml-1"
                              href={getUCSCBrowserLink(gene)}
                              onClick={() => handleExternalLinkClick(getUCSCBrowserLink(gene))}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-
                              {gene.coordinatesEnd}
                            </a>
                          </div>
                        )}
                        <div className="">
                          <VersionedLink to={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">
                            View all functions and evidence
                          </VersionedLink>
                        </div>
                      </div>
                    </td>
                    <td className="w-[23%] p-2">
                      <Terms
                        terms={gene.groupedTerms?.mfs}
                        maxTerms={expandedRows[gene.gene] ? 500 : 2}
                        onToggleExpand={() => handleExpandClick(gene)}
                      />
                    </td>
                    <td className="w-[20%] p-2">
                      <Terms
                        terms={gene.groupedTerms?.bps}
                        maxTerms={expandedRows[gene.gene] ? 500 : 2}
                        onToggleExpand={() => handleExpandClick(gene)}
                      />
                    </td>
                    <td className="w-[23%] p-2">
                      <Terms
                        terms={gene.groupedTerms?.ccs}
                        maxTerms={expandedRows[gene.gene] ? 500 : 2}
                        onToggleExpand={() => handleExpandClick(gene)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {geneCount > 0 && (
        <div className="mt-2 flex items-center justify-end gap-3 px-3 py-2 text-sm text-gray-700">
          <span>Rows per page:</span>
          <Select
            size="xs"
            w={72}
            data={['10', '20', '50', '100']}
            value={String(size)}
            onChange={handleRowsPerPageChange}
            allowDeselect={false}
          />
          <span className="ml-2">
            {pageStart}–{pageEnd} of {geneCount}
          </span>
          <div className="flex items-center gap-1">
            <ActionIcon
              variant="subtle"
              color="gray"
              disabled={page === 0}
              onClick={() => handlePageChange(page)}
              aria-label="Previous page"
            >
              <FiChevronLeft />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              disabled={page + 1 >= totalPages}
              onClick={() => handlePageChange(page + 2)}
              aria-label="Next page"
            >
              <FiChevronRight />
            </ActionIcon>
          </div>
        </div>
      )}
    </div>
  )
}

export default Genes
