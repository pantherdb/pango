import { ASPECT_MAP } from '@/@pango.core/data/config';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import type React from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import type { Annotation } from './models/annotation';

interface Term {
  aspect: string;
  label: string;
  displayId?: string;
  id: string;
}

interface Evidence {
  withGeneId?: {
    gene: string;
    geneSymbol: string;
    taxonId: string;
    taxonAbbr: string;
  };
  references: Array<{
    pmid: string;
    title: string;
    date: string;
  }>;
}

interface DetailedGroup {
  id: string;
  label: string;
}



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
  const getPubmedArticleUrl = (pmid: string): string => {
    if (!pmid) return '';
    const id = pmid?.split(':');
    return id.length > 0 ? `${ENVIRONMENT.pubmedUrl}${id[1]}` : '';
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border border-gray-200">
        <thead>
          <tr className="bg-white h-8 border-b border-primary-light">
            <th className="px-3 py-2 text-xs font-bold uppercase text-gray-600 w-64">
              <div className="flex items-center">
                <span>Term</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The annotated functional characteristic of the gene. These are as specific as possible."
                />
              </div>
            </th>
            <th className="px-3 py-2 text-xs font-bold uppercase text-gray-600">
              <div className="flex items-center">
                <span>GO Function Category</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The high-level category(ies) of the annotated GO term"
                />
              </div>
            </th>
            <th className="px-3 py-2 text-xs font-bold uppercase text-gray-600">
              <div className="flex items-center">
                <span>Evidence</span>
                <BiInfoCircle
                  className="ml-2"
                  title="The evidence for the annotated GO term"
                />
              </div>
            </th>
            <th className="px-3 py-2 text-xs font-bold uppercase text-gray-600 w-40">
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
        <tbody>
          {annotations.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="p-2 text-sm border-r border-gray-200">
                <div className="w-full">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold 
                      ${row.term.aspect === 'molecular_function' ? 'border-blue-500 text-blue-700' :
                        row.term.aspect === 'biological_process' ? 'border-green-500 text-green-700' :
                          'border-purple-500 text-purple-700'} border`}>
                      {ASPECT_MAP[row.term.aspect]?.shorthand}
                    </span>
                    <span className="ml-2">
                      {row.term.label}
                      {row.term.displayId && (
                        <a
                          href={`${ENVIRONMENT.amigoTermUrl}${row.term.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-gray-500 italic"
                        >
                          {row.term.displayId}
                        </a>
                      )}
                    </span>
                  </div>
                </div>
              </td>
              <td className="p-2 text-sm border-r border-gray-200">
                {row.slimTerms.map((term, termIdx) => (
                  <div key={termIdx} className="mb-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold 
                        ${term.aspect === 'molecular_function' ? 'border-blue-500 text-blue-700' :
                          term.aspect === 'biological_process' ? 'border-green-500 text-green-700' :
                            'border-purple-500 text-purple-700'} border`}>
                        {ASPECT_MAP[term.aspect]?.shorthand}
                      </span>
                      <span className="ml-2">
                        {term.label}
                        {term.displayId && (
                          <a
                            href={`${ENVIRONMENT.amigoTermUrl}${term.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-gray-500 italic"
                          >
                            {term.displayId}
                          </a>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </td>
              <td className="p-2 text-sm border-r border-gray-200">
                {row.evidence.slice(0, maxEvidences).map((evidence, evidenceIdx) => (
                  <div key={evidenceIdx} className="mb-4 border-b border-primary-light last:border-0">
                    {evidence.withGeneId && (
                      <div className="flex items-center mb-2">
                        {evidence.withGeneId.gene} ({evidence.withGeneId.geneSymbol})
                        (<a
                          href={`${ENVIRONMENT.taxonApiUrl}${evidence.withGeneId.taxonId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {evidence.withGeneId.taxonAbbr}
                        </a>)
                      </div>
                    )}
                    {evidence.references.slice(0, maxReferences).map((ref, refIdx) => (
                      <div key={refIdx} className="pl-8 mb-2">
                        <div>
                          <a
                            href={getPubmedArticleUrl(ref.pmid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            {ref.pmid}
                          </a>
                        </div>
                        <div className="text-gray-600">
                          {ref.title} <small>({ref.date})</small>
                        </div>
                      </div>
                    ))}
                    {evidence.references.length > maxReferences && (
                      <div className="pl-8">
                        <button className="text-blue-600">
                          — View {evidence.references.length - maxReferences} more reference(s)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {row.evidence.length > maxEvidences && (
                  <button className="text-blue-600">
                    — View {row.evidence.length - maxEvidences} more evidence
                  </button>
                )}
              </td>
              <td className="p-2 text-sm">
                {row.detailedGroups.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    {group && (
                      <a
                        href={group.id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        {group.label}
                      </a>
                    )}
                  </div>
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