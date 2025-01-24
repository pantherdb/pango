import type React from 'react';
import Terms from './Terms';
import type { GroupedTerms } from './models/gene';


interface TermCellsProps {
  groupedTerms: GroupedTerms;
  onToggleExpand: () => void;
}

const TermCells: React.FC<TermCellsProps> = ({ groupedTerms, onToggleExpand }) => {
  return (
    <>
      <td className="p-3 border-r w-1/5 border-gray-300">
        <Terms terms={groupedTerms.mfs} maxTerms={groupedTerms.maxTerms} onToggleExpand={onToggleExpand} />
      </td>
      <td className="p-3 border-r w-1/5 border-gray-300">
        <Terms terms={groupedTerms.bps} maxTerms={groupedTerms.maxTerms} onToggleExpand={onToggleExpand} />
      </td>
      <td className="p-3 border-r w-1/5 border-gray-300">
        <Terms terms={groupedTerms.ccs} maxTerms={groupedTerms.maxTerms} onToggleExpand={onToggleExpand} />
      </td>
    </>
  );
};

export default TermCells;