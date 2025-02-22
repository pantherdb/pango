import { useMediaQuery, useTheme } from '@mui/material'
import type { GroupedTerms, Term } from '@/features/terms/models/term'
import { useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import Terms from '@/features/terms/components/Terms'

interface GeneSummaryProps {
  groupedTerms: GroupedTerms
}

interface SectionProps {
  title: string
  terms: Term[]
  maxTerms: number
  isExpanded: boolean
  onToggle: () => void
}

const Section: React.FC<SectionProps> = ({
  title,
  terms,
  maxTerms,
  isExpanded,
  onToggle,
}) => {
  if (!terms || terms.length === 0) return null

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
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
          <Terms terms={terms} maxTerms={maxTerms} onToggleExpand={onToggle} />
        </div>
      )}
    </div>
  )
}

const GeneSummary: React.FC<GeneSummaryProps> = ({ groupedTerms }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
      <div className={`divide-y divide-gray-200 ${isMobile ? 'px-2' : 'px-4'}`}>
        {sections.map(({ title, terms }) => (
          <Section
            key={title}
            title={title}
            terms={terms || []}
            maxTerms={groupedTerms.maxTerms || 500}
            isExpanded={!!expandedSections[title]}
            onToggle={() => toggleSection(title)}
          />
        ))}
      </div>
    </div>
  )
}

export default GeneSummary