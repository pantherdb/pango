import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import AnnotationTable from '@/features/annotations/components/AnnotationTable';
import { useGetAnnotationsQuery } from '@/features/annotations/slices/annotationsApiSlice';
import GeneSummary from '@/features/genes/components/GeneSummary';
import { transformTerms } from '@/features/genes/services/genesService';
import { useEffect } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from './hooks';
import { TermType } from '@/features/terms/models/term';
import { ASPECT_ORDER } from '@/@pango.core/data/config';
import { getAGRLink, getFamilyLink, getHGNC, getHGNCLink, getNCBIGeneLink, getUCSCBrowserLink, getUniprotLink } from '@/@pango.core/services/linksService';


interface InfoRowProps {
  label: string;
  value: string;
  href?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, href }) => (
  <div className="flex items-center p-1">
    <span className="pr-2 font-semibold text-gray-600">
      {label}:
    </span>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center"
      >
        {value}
        <FiExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="">{value}</span>
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
    <span className="text-5xl font-bold text-sky-700 mr-4 ">
      {number}
    </span>
    <div className="label-group">
      <div className="text-base font-medium mb-1">{label}</div>
      {sublabel && <div className="font-normal text-gray-600">{sublabel}</div>}
    </div>
  </div>
);

const Gene: React.FC = () => {
  const dispatch = useAppDispatch();
  const { id: geneId } = useParams<{ id: string }>();

  useEffect(() => {
    dispatch(setLeftDrawerOpen(false));
  }, [dispatch]);

  const filterArgs = { geneIds: [geneId] };
  const pageArgs = { page: 0, size: 200 };
  const { data: annotationsData } = useGetAnnotationsQuery({ filterArgs, pageArgs });


  const annotations = [...(annotationsData?.annotations || [])].sort((a, b) => {
    const aspectA = a.term?.aspect?.toLowerCase() || '';
    const aspectB = b.term?.aspect?.toLowerCase() || '';
    return (ASPECT_ORDER[aspectA] || 999) - (ASPECT_ORDER[aspectB] || 999);
  });

  const annotation = annotations && annotations.length > 0 ? annotations[0] : null;
  const hgncId = getHGNC(annotation?.longId || '');
  //const geneAccession = getGeneAccession(annotation?.gene || '');

  if (!annotation) {
    return <div className="p-4">Loading...</div>;
  }

  const knownTermTypes = annotations.filter(a => a.termType === TermType.KNOWN).length;
  const unknownTermTypes = annotations.filter(a => a.termType === TermType.UNKNOWN).length;
  const groupedTerms = transformTerms(annotations, 150);

  return (
    <div className="w-full bg-slate-100">
      <div className="p-3 max-w-[1000px] mx-auto">
        {/* Gene Header Section */}
        <div className="pango-gene-summary w-full px-3 py-4 pb-10">
          <h1 className="font-normal text-4xl mb-10">
            <span className="font-bold">{annotation.geneSymbol}</span>: PAN-GO functions and evidence
          </h1>

          <div className="flex  w-full">
            {/* Gene Information Column */}
            <div className="w-[300px] mr-[100px]">
              <h2 className="text-2xl font-semibold mb-4">Gene Information</h2>
              <div className="">
                <InfoRow label="Gene" value={annotation.geneSymbol} />
                <InfoRow label="Protein" value={annotation.geneName} />
                <InfoRow
                  label="GO annotations from all sources"
                  value={annotation?.gene.replace('UniProtKB', 'UniProt')}
                  href={ENVIRONMENT.amigoGPUrl + annotation.gene}
                />
                <InfoRow
                  label="PAN-GO evolutionary model for this family"
                  value={annotation.pantherFamily}
                  href={ENVIRONMENT.pantreeUrl + annotation.pantherFamily}
                />
              </div>
            </div>

            {/* External Links Column */}
            <div className="w-[300px]">
              <h2 className="text-2xl font-semibold mb-4">External Links</h2>
              <div className="">
                <InfoRow
                  label="UniProt ID"
                  value={annotation?.gene.replace('UniProtKB', 'UniProt')}
                  href={getUniprotLink(annotation.gene)}
                />
                <InfoRow
                  label="PANTHER Tree Viewer"
                  value={annotation.pantherFamily}
                  href={getFamilyLink(annotation)}
                />
                {annotation.coordinatesChrNum && (
                  <InfoRow
                    label="UCSC Genome Browser"
                    value={`chr${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`}
                    href={getUCSCBrowserLink(annotation)}
                  />

                )}

                {hgncId && (
                  <>
                    <InfoRow
                      label="Alliance of Genome Resources"
                      value={hgncId}
                      href={getAGRLink(hgncId)}
                    />
                    <InfoRow
                      label="HUGO Gene Nomenclature Committee"
                      value={hgncId}
                      href={getHGNCLink(hgncId)}
                    />
                  </>
                )}
                <InfoRow
                  label="NCBI Gene"
                  value={annotation.geneSymbol}
                  href={getNCBIGeneLink(annotation.geneSymbol)}
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
          <div className="w-full bg-white">
            <GeneSummary groupedTerms={groupedTerms} />
          </div>
        )}
        <div className="py-6 px-4 bg-gradient-to-r from-slate-100 to-white">
          <h2 className="text-2xl font-semibold tracking-tight m-0">Function Details
          </h2>
        </div>
        {annotations.length > 0 && (
          <div className="w-full bg-white">
            <AnnotationTable annotations={annotations} />
          </div>
        )}
      </div>
    </div>
  );
};



export default Gene;