import { ASPECT_MAP } from '@/@pango.core/data/config';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import type React from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import { setRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import { useAppDispatch } from '@/app/hooks';
import type { Annotation } from '../models/annotation';
import { setSelectedAnnotation } from '../slices/selectedAnnotationSlice';

// TODO: Add tooltips

interface AnnotationTableProps {
  annotations: Annotation[];
  maxReferences?: number;
  maxEvidences?: number;
}

const AnnotationTable: React.FC<AnnotationTableProps> = ({
  annotations,
  maxReferences = 2,
  maxEvidences = 2,
}) => {
  const dispatch = useAppDispatch();

  const handleRowClick = (annotation: Annotation) => {
    dispatch(setSelectedAnnotation(annotation));
    dispatch(setRightDrawerOpen(true));
  };

  const getPubmedArticleUrl = (pmid: string): string => {
    if (!pmid) return '';
    const id = pmid?.split(':');
    return id.length > 0 ? `${ENVIRONMENT.pubmedUrl}${id[1]}` : '';
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-white h-8 border-b border-primary-light">
            <th className="w-64">
              <div className="flex items-center">
                <span>Term</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The annotated functional characteristic of the gene. These are as specific as possible."
                />
              </div>
            </th>
            <th className="">
              <div className="flex items-center">
                <span>GO Function Category</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The high-level category(ies) of the annotated GO term"
                />
              </div>
            </th>
            <th className="">
              <div className="flex items-center">
                <span>Evidence</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The evidence for the annotated GO term"
                />
              </div>
            </th>
            <th className="w-40">
              <div className="flex items-center">
                <span>Contributors</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The GO Consortium groups that created the annotations"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {annotations.map((row, idx) => (
            <tr key={idx} onClick={() => handleRowClick(row)} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-3 py-2">
                <div className="flex items-center">
                  <span
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border"
                    style={{
                      borderColor: ASPECT_MAP[row.term.aspect]?.color,
                      color: ASPECT_MAP[row.term.aspect]?.color,
                      backgroundColor: `${ASPECT_MAP[row.term.aspect]?.color}20`
                    }}>
                    {ASPECT_MAP[row.term.aspect]?.shorthand}
                  </span>
                  <div className="ml-2">
                    <span className="text-sm">{row.term.label}</span>
                    {row.term.displayId && (
                      <a href={`${ENVIRONMENT.amigoTermUrl}${row.term.id}`} target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-gray-500 hover:text-gray-700 text-xs italic">
                        {row.term.displayId}
                      </a>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">
                {row.slimTerms.map((term, termIdx) => (
                  <div key={termIdx} className="mb-1 last:mb-0 flex items-center">
                    <span
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border"
                      style={{
                        borderColor: ASPECT_MAP[term.aspect]?.color,
                        color: ASPECT_MAP[term.aspect]?.color,
                        backgroundColor: `${ASPECT_MAP[term.aspect]?.color}20`
                      }}>
                      {ASPECT_MAP[term.aspect]?.shorthand}
                    </span>
                    <div className="ml-2">
                      <span className="text-sm">{term.label}</span>
                      {term.displayId && (
                        <a href={`${ENVIRONMENT.amigoTermUrl}${term.id}`} target="_blank" rel="noopener noreferrer"
                          className="ml-2 text-gray-500 hover:text-gray-700 text-xs italic">
                          {term.displayId}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </td>
              <td className="px-3 py-2">
                {row.evidence.slice(0, maxEvidences).map((evidence, evidenceIdx) => (
                  <div key={evidenceIdx} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-0 border-gray-200">
                    {evidence.withGeneId && (
                      <div className="text-sm mb-1">
                        {evidence.withGeneId.gene} ({evidence.withGeneId.geneSymbol})
                        (<a href={`${ENVIRONMENT.taxonApiUrl}${evidence.withGeneId.taxonId}`} target="_blank" rel="noopener noreferrer"
                          className="">
                          {evidence.withGeneId.taxonAbbr}
                        </a>)
                      </div>
                    )}
                    <div className="ml-4">
                      {evidence.references.slice(0, maxReferences).map((ref, refIdx) => (
                        <div key={refIdx} className="mb-1 last:mb-0">
                          <a href={getPubmedArticleUrl(ref.pmid)} target="_blank" rel="noopener noreferrer"
                            className=" text-sm">
                            {ref.pmid}
                          </a>
                          <div className="text-xs text-gray-600">
                            {ref.title} <span className="text-gray-500">({ref.date})</span>
                          </div>
                        </div>
                      ))}
                      {evidence.references.length > maxReferences && (
                        <button className=" text-xs mt-1">
                          + {evidence.references.length - maxReferences} more reference(s)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {row.evidence.length > maxEvidences && (
                  <button className=" text-xs">
                    + {row.evidence.length - maxEvidences} more evidence
                  </button>
                )}
              </td>
              <td className="px-3 py-2">
                {row.detailedGroups.map((group, groupIdx) => (
                  group && (
                    <a key={groupIdx} href={group.id} target="_blank" rel="noopener noreferrer"
                      className=" text-sm block mb-1 last:mb-0">
                      {group.label}
                    </a>
                  )
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnnotationTable;