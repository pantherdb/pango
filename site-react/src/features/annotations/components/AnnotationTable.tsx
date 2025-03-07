import { ASPECT_MAP, EVIDENCE_TYPE_MAP, EvidenceType } from '@/@pango.core/data/config'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import type React from 'react'
import { setRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { useAppDispatch } from '@/app/hooks'
import type { Annotation } from '../models/annotation'
import { setSelectedAnnotation } from '../slices/selectedAnnotationSlice'
import TermLink from '@/features/terms/components/TermLink'
import Tooltip from '@mui/material/Tooltip'
import { getPubmedArticleUrl } from '@/@pango.core/services/linksService'
import { FaFlask } from 'react-icons/fa'
import { PiEmptyLight } from 'react-icons/pi'
import { TbBinaryTreeFilled } from 'react-icons/tb'

interface AnnotationTableProps {
  annotations: Annotation[]
  maxReferences?: number
  maxEvidences?: number
}

const AnnotationTable: React.FC<AnnotationTableProps> = ({
  annotations,
  maxReferences = 2,
  maxEvidences = 2,
}) => {
  const dispatch = useAppDispatch()

  const handleRowClick = (annotation: Annotation) => {
    dispatch(setSelectedAnnotation(annotation))
    dispatch(setRightDrawerOpen(true))
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-primary-light h-8 border-b bg-white">
            <th className="w-8"></th>
            <th className="w-64">
              <div className="flex items-center">
                <Tooltip
                  title="The annotated functional characteristic of the gene. These are as specific as possible."
                  placement="top"
                  enterDelay={1500}
                  arrow
                >
                  <span>Term</span>
                </Tooltip>
              </div>
            </th>
            <th className="">
              <div className="flex items-center">
                <Tooltip
                  title="The high-level category(ies) of the annotated GO term."
                  placement="top"
                  enterDelay={1500}
                  arrow
                >
                  <span>GO Function Category</span>
                </Tooltip>
              </div>
            </th>
            <th className="">
              <div className="flex items-center">
                <Tooltip
                  title="The evidence for the annotated GO term"
                  placement="top"
                  enterDelay={1500}
                  arrow
                >
                  <span>Evidence</span>
                </Tooltip>
              </div>
            </th>
            <th className="w-40">
              <div className="flex items-center">
                <Tooltip
                  title="The GO Consortium groups that created the annotations."
                  placement="top"
                  enterDelay={1500}
                  arrow
                >
                  <span>Contributors</span>
                </Tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {annotations.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => handleRowClick(row)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="w-10 px-2 py-4">
                <Tooltip title={EVIDENCE_TYPE_MAP[row.evidenceType]?.iconTooltip}>
                  <div className="flex h-8 w-8 items-center justify-center text-gray-600">
                    {row.evidenceType === EvidenceType.DIRECT && <FaFlask className={`text-2xl`} />}

                    {row.evidenceType === EvidenceType.HOMOLOGY && (
                      <div className={`text-2xl`}>
                        <TbBinaryTreeFilled />
                      </div>
                    )}

                    {row.evidenceType === EvidenceType.NA && (
                      <div className="relative text-2xl">
                        <PiEmptyLight className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </Tooltip>
              </td>
              <td className="min-w-[250px] p-3">
                <div className="flex items-center">
                  <span
                    className="inline-flex !h-8 !w-8 items-center justify-center rounded-full border text-sm font-bold"
                    style={{
                      borderColor: ASPECT_MAP[row.term.aspect]?.color,
                      color: ASPECT_MAP[row.term.aspect]?.color,
                      backgroundColor: `${ASPECT_MAP[row.term.aspect]?.color}20`,
                    }}
                  >
                    {ASPECT_MAP[row.term.aspect]?.shorthand}
                  </span>
                  <div className="ml-2">
                    <div className="ml-2">
                      <TermLink term={row.term} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="min-w-[220px] p-3">
                {row.slimTerms.map((term, termIdx) => (
                  <div key={termIdx} className="mb-1 flex items-center last:mb-0">
                    <span
                      className="inline-flex !h-8 !w-8 items-center justify-center rounded-full border text-sm font-bold"
                      style={{
                        borderColor: ASPECT_MAP[term.aspect]?.color,
                        color: ASPECT_MAP[term.aspect]?.color,
                        backgroundColor: `${ASPECT_MAP[term.aspect]?.color}20`,
                      }}
                    >
                      {ASPECT_MAP[term.aspect]?.shorthand}
                    </span>
                    <div className="ml-2">
                      <TermLink term={term} />
                    </div>
                  </div>
                ))}
              </td>
              <td className="px-3 py-4">
                {row.evidence.slice(0, maxEvidences).map((evidence, evidenceIdx) => (
                  <div
                    key={evidenceIdx}
                    className="mb-2 border-b border-gray-200 pb-2 last:mb-0 last:border-0 last:pb-0"
                  >
                    {evidence.withGeneId && (
                      <div className="mb-1 text-sm">
                        {evidence.withGeneId.gene} ({evidence.withGeneId.geneSymbol}) (
                        <a
                          href={ENVIRONMENT.taxonApiUrl + evidence.withGeneId.taxonId}
                          target="_blank"
                          rel="noopener noreferrer"
                          className=""
                        >
                          {evidence.withGeneId.taxonAbbr}
                        </a>
                        )
                        <div className="font-normal text-gray-600">
                          {evidence.withGeneId.geneName}
                        </div>
                      </div>
                    )}
                    <div className="ml-4">
                      {evidence.references.slice(0, maxReferences).map((ref, refIdx) => (
                        <div key={refIdx} className="mb-1 last:mb-0">
                          <a
                            href={getPubmedArticleUrl(ref.pmid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm"
                          >
                            {ref.pmid}
                          </a>
                          <div className="text-gray-600">
                            {ref.title} <span className="text-gray-500">({ref.date})</span>
                          </div>
                        </div>
                      ))}
                      {evidence.references.length > maxReferences && (
                        <button className="mt-1">
                          + {evidence.references.length - maxReferences} more reference(s)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {row.evidence.length > maxEvidences && (
                  <button className="">+ {row.evidence.length - maxEvidences} more evidence</button>
                )}
              </td>
              <td className="px-3 py-4">
                {row.detailedGroups.map(
                  (group, groupIdx) =>
                    group && (
                      <a
                        key={groupIdx}
                        href={group.id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-1 block text-sm last:mb-0"
                      >
                        {group.label}
                      </a>
                    )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AnnotationTable
