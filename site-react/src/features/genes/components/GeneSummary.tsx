import TermCells from '@/features/terms/components/TermCells';
import type { GroupedTerms } from '@/features/terms/models/term';
import type React from 'react';


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
              <th className="">
                Molecular Functions
              </th>
              <th className="">
                Biological Processes
              </th>
              <th className="">
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