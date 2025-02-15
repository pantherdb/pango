import type React from 'react'
import { Tooltip } from '@mui/material'
import { FaCaretRight, FaCaretDown } from 'react-icons/fa'
import type { Gene } from '../models/gene'
import Terms from '@/features/terms/components/Terms'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { getUniprotLink, getUCSCBrowserLink } from '@/@pango.core/services/linksService'
import { ANNOTATION_COLS } from '@/@pango.core/data/config'

interface GeneResultsProps {
  genes: Gene[];
  expandedRows: Record<string, boolean>;
  onExpandRow: (gene: Gene) => void;
}

const GeneResults: React.FC<GeneResultsProps> = ({ genes, expandedRows, onExpandRow }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10"></th>
            {ANNOTATION_COLS.map(col => (
              <th key={col.id}>
                <Tooltip enterDelay={1500} placement="top" title={col.tooltip} arrow>
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
                  onClick={() => onExpandRow(gene)}
                  className="text-lg text-gray-700"
                >
                  {expandedRows[gene.gene] ? <FaCaretDown /> : <FaCaretRight />}
                </button>
              </td>
              <td className="border-r border-gray-300 p-3">
                <div className="space-y-1 flex flex-col">
                  <div className="text-lg font-bold">
                    <VersionedLink
                      to={`/gene/${gene.gene}`}
                      className="mr-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {gene.geneSymbol}
                    </VersionedLink>
                  </div>
                  <div className="text-gray-600">{gene.geneName}</div>
                  <div className="">
                    <a
                      href={getUniprotLink(gene.gene)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {gene?.gene}
                    </a>
                  </div>
                  {gene.coordinatesChrNum && (
                    <div className="inline-block px-2pl-0">
                      UCSC Browser:
                      <a
                        className="pl-1"
                        href={getUCSCBrowserLink(gene)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-
                        {gene.coordinatesEnd}
                      </a>
                    </div>
                  )}
                  <div className="text-sm">
                    <VersionedLink to={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">
                      View all functions and evidence
                    </VersionedLink>
                  </div>
                </div>
              </td>
              <td className="w-1/5 border-r border-gray-300 p-3">
                <Terms
                  terms={gene.groupedTerms?.mfs}
                  maxTerms={expandedRows[gene.gene] ? 500 : 2}
                  onToggleExpand={() => onExpandRow(gene)}
                />
              </td>
              <td className="w-1/5 border-r border-gray-300 p-3">
                <Terms
                  terms={gene.groupedTerms?.bps}
                  maxTerms={expandedRows[gene.gene] ? 500 : 2}
                  onToggleExpand={() => onExpandRow(gene)}
                />
              </td>
              <td className="w-1/5 border-r border-gray-300 p-3">
                <Terms
                  terms={gene.groupedTerms?.ccs}
                  maxTerms={expandedRows[gene.gene] ? 500 : 2}
                  onToggleExpand={() => onExpandRow(gene)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GeneResults