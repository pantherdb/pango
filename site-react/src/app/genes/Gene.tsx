import { ENVIRONMENT } from '@/@pango.core/data/constants';
import { useParams } from 'react-router-dom';
import { useGetAnnotationsQuery } from '../annotations/annotationsApiSlice';
import type { Annotation } from '../annotations/models/annotation';
import { FiExternalLink } from 'react-icons/fi';
import AnnotationTable from '../annotations/AnnotationTable';
import GeneSummary from './GeneSummary';
import { transformTerms } from './services/genesService';
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import { useEffect } from 'react';
import { useAppDispatch } from '../hooks';

const Gene: React.FC = () => {
  const dispatch = useAppDispatch();
  const { id: geneId } = useParams<{ id: string }>();

  useEffect(() => {
    dispatch(setLeftDrawerOpen(false));
  }, [dispatch]);

  const filterArgs = { geneIds: [geneId] };
  const pageArgs = { page: 0, size: 200 };
  const { data: annotationsData } = useGetAnnotationsQuery({ filterArgs, pageArgs });

  const annotations = annotationsData?.annotations || [];

  const annotation = annotations && annotations.length > 0 ? annotations[0] : null;

  if (!annotation) {
    return <div className="p-4">Loading...</div>;
  }

  const knownTermTypes = annotations.filter(a => a.termType === 'known').length;
  const unknownTermTypes = annotations.filter(a => a.termType === 'unknown').length;

  const groupedTerms = transformTerms(annotations, 100);

  const getUniprotLink = (gene: string) => {
    const geneId = gene.split(':');
    return geneId.length > 1 ? `${ENVIRONMENT}${geneId[1]}` : gene;
  };

  const getFamilyLink = (element: Annotation) => {
    return `${ENVIRONMENT}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`;
  };



  return (
    <div className="w-full bg-slate-200">
      <div className="p-3">
        {/* Gene Header Section */}
        <div className="pango-gene-summary w-full px-3 py-4">
          <h1 className="font-normal text-2xl">
            <span className="font-bold">{annotation.geneSymbol}</span>: PAN-GO functions and evidence
          </h1>

          <div className="flex  w-full">
            {/* Gene Information Column */}
            <div className="w-[300px] mr-[100px]">
              <h2 className="text-xl font-semibold mb-4">Gene Information</h2>
              <div className="space-y-1">
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
            <div className="w-[300px]">
              <h2 className="text-xl font-semibold mb-4">External Links</h2>
              <div className="space-y-1">
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
        </div>

        {/* Stats Header */}
        <div className="py-6 px-4 bg-gradient-to-r from-slate-100 to-white">
          <div className="flex items-center gap-12">
            <div className="w-[250px]">
              <h2 className="text-2xl font-semibold tracking-tight m-0">Function Summary</h2>
            </div>

            <StatBlock
              number={knownTermTypes}
              label="Annotations"
              sublabel="(functional characteristics)"
            />

            <StatBlock
              number={unknownTermTypes}
              label="Unknown function aspects"
            />
          </div>
        </div>
        {annotations.length > 0 && (
          <div className="w-full bg-white py-4">
            <GeneSummary groupedTerms={groupedTerms} />
          </div>
        )}
        <div className="py-6 px-4 bg-gradient-to-r from-slate-100 to-white">
          <h2 className="text-2xl font-semibold tracking-tight m-0">Function Details</h2>
        </div>
        {annotations.length > 0 && (
          <div className="w-full bg-white py-4">
            <AnnotationTable annotations={annotations} />
          </div>
        )}
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
  <div className="flex items-center p-[5px]">
    <span className="text-xs pr-2 text-gray-700">
      {label}:
    </span>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        {value}
        <FiExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-gray-500">{value}</span>
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
    <span className="text-5xl font-bold text-[#1976d2] mr-4 min-w-[60px] text-center">
      {number}
    </span>
    <div className="label-group">
      <div className="text-base font-medium mb-1">{label}</div>
      {sublabel && <div className="text-sm font-normal text-gray-600">{sublabel}</div>}
    </div>
  </div>
);

export default Gene;