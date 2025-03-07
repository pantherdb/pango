import type React from 'react'
import Terms from './Terms'
import type { GroupedTerms } from '../models/term'

// TODO shrinking width of flex on term aspect
interface TermCellsProps {
  groupedTerms: GroupedTerms
  onToggleExpand: () => void
}

const TermCells: React.FC<TermCellsProps> = ({ groupedTerms, onToggleExpand }) => {
  return (
    <>
      <td className="w-1/5 border-r border-gray-300 p-2">
        <Terms
          terms={groupedTerms.mfs}
          maxTerms={groupedTerms.maxTerms}
          onToggleExpand={onToggleExpand}
        />
      </td>
      <td className="w-1/5 border-r border-gray-300 p-2">
        <Terms
          terms={groupedTerms.bps}
          maxTerms={groupedTerms.maxTerms}
          onToggleExpand={onToggleExpand}
        />
      </td>
      <td className="w-1/5 border-r border-gray-300 p-2">
        <Terms
          terms={groupedTerms.ccs}
          maxTerms={groupedTerms.maxTerms}
          onToggleExpand={onToggleExpand}
        />
      </td>
    </>
  )
}

export default TermCells
