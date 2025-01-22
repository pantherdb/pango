
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import { useParams } from 'react-router-dom';
import { useGetAnnotationsQuery, useGetAnnotationStatsQuery } from '../annotations/annotationsApiSlice';
import type { Annotation } from '../annotations/models/annotation';
import { FiExternalLink } from 'react-icons/fi';

const Gene: React.FC = () => {
  const { geneId } = useParams<{ geneId: string }>();

  const filterArgs = { geneIds: [geneId] };
  const pageArgs = { page: 0, size: 200 };
  const { data: annotationsData } = useGetAnnotationsQuery({ filterArgs, pageArgs });
  const { data: statsData } = useGetAnnotationStatsQuery({ filterArgs, pageArgs });

  // Get the first annotation for gene details
  const annotation = annotationsData?.annotations?.[0];
  const stats = statsData?.termTypeFrequency?.buckets || [];

  const knowledgeCount = {
    known: stats.find(b => b.key === 'known')?.docCount || 0,
    unknown: stats.find(b => b.key === 'unknown')?.docCount || 0,
  };

  if (!annotation) {
    return <div className="p-4">Loading...</div>;
  }

  const getUniprotLink = (gene: string) => {
    const geneId = gene.split(':');
    return geneId.length > 1 ? `${ENVIRONMENT}${geneId[1]}` : gene;
  };

  const getFamilyLink = (element: Annotation) => {
    return `${ENVIRONMENT}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`;
  };

  return (
    <div className="w-full bg-gray-50">
      <div className="p-3">
        {/* Gene Header */}
        <h1 className="text-2xl mb-6">
          <span className="font-bold">{annotation.geneSymbol}</span>: PAN-GO functions and evidence
        </h1>

        {/* Gene Information Grid */}
        <div className="grid grid-cols-2 gap-x-24 mb-8">
          {/* Gene Information Column */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Gene Information</h2>
            <div className="space-y-2">
              <InfoRow label="Gene" value={annotation.geneSymbol} />
              <InfoRow label="Protein" value={annotation.geneName} />
              <InfoRow
                label="Organism"
                value={annotation.taxonLabel}
                href={`${ENVIRONMENT}${annotation.taxonId}`}
              />
              <InfoRow
                label="GO annotations from all sources"
                value={annotation.gene}
                href={`${ENVIRONMENT}${annotation.gene}`}
              />
            </div>
          </div>

          {/* External Links Column */}
          <div>
            <h2 className="text-xl font-semibold mb-4">External Links</h2>
            <div className="space-y-2">
              <InfoRow
                label="UniProt ID"
                value={annotation.gene}
                href={getUniprotLink(annotation.gene)}
              />
              <InfoRow
                label="PANTHER Tree Viewer"
                value={annotation.pantherFamily}
                href={getFamilyLink(annotation)}
              />
              <InfoRow
                label="UCSC Genome Browser"
                value={`chr${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`}
                href={`${ENVIRONMENT}chr${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`}
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-gray-50 to-white p-6 rounded-lg mb-8">
          <div className="flex items-center gap-12">
            <div className="w-60">
              <h2 className="text-2xl font-semibold m-0">Function summary</h2>
            </div>

            <StatBlock
              number={knowledgeCount.known}
              label="Annotations"
              sublabel="(functional characteristics)"
            />

            <StatBlock
              number={knowledgeCount.unknown}
              label="Unknown function aspects"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  href?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, href }) => (
  <div className="flex items-center text-sm">
    <span className="mr-2 text-gray-700">{label}:</span>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        {value}
        <FiExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-gray-600">{value}</span>
    )}
  </div>
);

interface StatBlockProps {
  number: number;
  label: string;
  sublabel?: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ number, label, sublabel }) => (
  <div className="flex items-center pl-6">
    <span className="text-5xl font-bold text-blue-600 mr-4 min-w-[60px] text-center">
      {number}
    </span>
    <div>
      <div className="text-base font-medium mb-1">{label}</div>
      {sublabel && <div className="text-sm text-gray-600">{sublabel}</div>}
    </div>
  </div>
);

export default Gene;