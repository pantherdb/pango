import type React from 'react'
import { FiChevronRight, FiUsers, FiBookOpen, FiTag } from 'react-icons/fi'
import TermLink from '@/features/terms/components/TermLink'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import type { Annotation } from '../models/annotation'
import { setRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { useAppDispatch } from '@/app/hooks'
import { setSelectedAnnotation } from '../slices/selectedAnnotationSlice'
import { ENVIRONMENT } from '@/@pango.core/data/constants'

interface AnnotationCardsProps {
  annotations: Annotation[]
  maxReferences?: number
  maxEvidences?: number
}

const AnnotationCards: React.FC<AnnotationCardsProps> = ({
  annotations,
  maxReferences = 2,
  maxEvidences = 2,
}) => {
  const dispatch = useAppDispatch()

  const handleRowClick = (annotation: Annotation) => {
    dispatch(setSelectedAnnotation(annotation))
    dispatch(setRightDrawerOpen(true))
  }

  const getPubmedArticleUrl = (pmid: string): string => {
    if (!pmid) return ''
    const id = pmid?.split(':')
    return id.length > 0 ? ENVIRONMENT.pubmedUrl + id[1] : ''
  }

  return (
    <div className="space-y-4">
      {annotations.map((annotation, idx) => (
        <div
          key={idx}
          className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
          onClick={() => handleRowClick(annotation)}
        >
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold"
                style={{
                  borderColor: ASPECT_MAP[annotation.term.aspect]?.color,
                  color: ASPECT_MAP[annotation.term.aspect]?.color,
                  backgroundColor: `${ASPECT_MAP[annotation.term.aspect]?.color}20`,
                }}
              >
                {ASPECT_MAP[annotation.term.aspect]?.shorthand}
              </span>
              <div className="flex-1">
                <TermLink term={annotation.term} />
              </div>
              <FiChevronRight className="text-gray-400" />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FiTag className="mt-1 text-gray-500" />
                <div className="flex-1">
                  {annotation.slimTerms.map((term, termIdx) => (
                    <div key={termIdx} className="mb-1 last:mb-0">
                      <TermLink term={term} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiBookOpen className="mt-1 text-gray-500" />
                <div className="flex-1">
                  {annotation.evidence.slice(0, maxEvidences).map((evidence, evidenceIdx) => (
                    <div key={evidenceIdx} className="mb-2 last:mb-0">
                      {evidence.withGeneId && (
                        <div className="mb-1 text-sm">
                          {evidence.withGeneId.gene} ({evidence.withGeneId.geneSymbol})
                        </div>
                      )}
                      {evidence.references.slice(0, maxReferences).map((ref, refIdx) => (
                        <div key={refIdx} className="mb-1 text-sm text-gray-600">
                          <a
                            href={getPubmedArticleUrl(ref.pmid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                            onClick={e => e.stopPropagation()}
                          >
                            {ref.pmid}
                          </a>
                        </div>
                      ))}
                      {evidence.references.length > maxReferences && (
                        <button className="mt-1 text-sm text-gray-500">
                          + {evidence.references.length - maxReferences} more reference(s)
                        </button>
                      )}
                    </div>
                  ))}
                  {annotation.evidence.length > maxEvidences && (
                    <button className="text-sm text-gray-500">
                      + {annotation.evidence.length - maxEvidences} more evidence
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FiUsers className="mt-1 text-gray-500" />
                <div className="flex-1">
                  {annotation.detailedGroups.map(
                    (group, groupIdx) =>
                      group && (
                        <a
                          key={groupIdx}
                          href={group.id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-1 block text-sm text-blue-600 last:mb-0"
                          onClick={e => e.stopPropagation()}
                        >
                          {group.label}
                        </a>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AnnotationCards
