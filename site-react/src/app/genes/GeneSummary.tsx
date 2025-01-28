import type React from 'react';
import type { GroupedTerms } from './models/gene';
import TermCells from './TermCells';



interface GeneSummaryProps {
  groupedTerms: GroupedTerms;
}

const GeneSummary: React.FC<GeneSummaryProps> = ({ groupedTerms }) => {
  function handleExpandClick(): void { }

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-t border-accent-700">
              <th className="p-3 text-left text-xs font-bold uppercase border-r border-gray-300">
                Molecular Functions
              </th>
              <th className="p-3 text-left text-xs font-bold uppercase border-r border-gray-300">
                Biological Processes
              </th>
              <th className="p-3 text-left text-xs font-bold uppercase border-r border-gray-300">
                Cellular Components
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <TermCells
                groupedTerms={groupedTerms}
                onToggleExpand={handleExpandClick}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneSummary;