import type { GroupedTerms, Term } from '@/features/terms/models/term'
import { useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import TermCells from '@/features/terms/components/TermCells'
import Terms from '@/features/terms/components/Terms'
import { useIsMobile } from '@/shared/hooks/useIsMobile'

interface GeneSummaryProps {
  groupedTerms: GroupedTerms
}

interface MobileSectionProps {
  title: string
  terms: Term[]
  maxTerms: number
  isExpanded: boolean
  onToggle: () => void
  onShowAll: () => void
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  terms,
  maxTerms,
  isExpanded,
  onToggle,
  onShowAll,
}) => {
  if (!terms || terms.length === 0) return null

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center">
          {isExpanded ? (
            <FiChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <FiChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <span className="ml-2 font-medium text-gray-900">{title}</span>
          <span className="ml-2 rounded-full bg-sky-100 px-2.5 py-0.5 text-sm text-sky-800">
            {terms.length}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="bg-gray-50 px-4 py-3">
          <Terms terms={terms} maxTerms={maxTerms} onToggleExpand={onShowAll} />
        </div>
      )}
    </div>
  )
}

const GeneSummary: React.FC<GeneSummaryProps> = ({ groupedTerms }) => {
  const isMobile = useIsMobile()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Molecular Function': true,
    'Biological Process': true,
    'Cellular Component': true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // "View N more terms" lifts the per-aspect limit for the whole summary.
  const [showAllTerms, setShowAllTerms] = useState(false)
  const maxTerms = showAllTerms ? Number.POSITIVE_INFINITY : groupedTerms.maxTerms || 500
  const showAll = () => setShowAllTerms(true)

  if (isMobile) {
    const sections = [
      {
        title: 'Molecular Function',
        terms: groupedTerms.mfs,
      },
      {
        title: 'Biological Process',
        terms: groupedTerms.bps,
      },
      {
        title: 'Cellular Component',
        terms: groupedTerms.ccs,
      },
    ]

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200 px-2">
          {sections.map(({ title, terms }) => (
            <MobileSection
              key={title}
              title={title}
              terms={terms || []}
              maxTerms={maxTerms}
              isExpanded={!!expandedSections[title]}
              onToggle={() => toggleSection(title)}
              onShowAll={showAll}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-b border-accent-700">
              <th className="">Molecular Functions</th>
              <th className="">Biological Processes</th>
              <th className="">Cellular Components</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <TermCells groupedTerms={{ ...groupedTerms, maxTerms }} onToggleExpand={showAll} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GeneSummary
