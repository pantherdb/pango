import type { FC } from 'react';
import { TablePagination, CircularProgress, Tooltip } from '@mui/material';
import { FaFlask, FaCaretRight, FaCaretDown } from 'react-icons/fa';
import { useGetGenesCountQuery, useGetGenesQuery } from './genesApiSlice';
import type { Term, Gene } from './models/gene';
import { EVIDENCE_TYPE_MAP } from '@/@pango.core/data/config';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import { useAppSelector } from '../hooks';
import type { RootState } from '../store/store';

interface GenesProps {
  page?: number;
  size?: number;
}

const Genes: FC<GenesProps> = ({ page = 0, size = 20 }) => {
  const search = useAppSelector((state: RootState) => state.search);
  const filter = {
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id)
  };

  const { data, isLoading, error } = useGetGenesQuery({ page, size, filter });
  const { data: countData } = useGetGenesCountQuery({ filter });

  const genes = data?.genes ?? [];
  const geneCount = countData?.total || 0;

  const cols = ['Gene', 'Molecular Functions', 'Biological Processes', 'Cellular Components'];

  const handleExpandClick = (gene: Gene) => {
    gene.expanded = !gene.expanded;
    gene.maxTerms = gene.expanded ? 500 : 2;
  };

  const getUniprotLink = (gene: Gene) => {
    const geneId = gene.gene?.split(':');
    return geneId.length > 1 ? `${ENVIRONMENT.uniprotUrl}${geneId[1]}` : gene.gene;
  };

  const renderTerms = (terms: Term[], gene: Gene) => (
    <>
      {terms.slice(0, gene.maxTerms).map((term, idx) => (
        <div key={idx} className="w-full">
          <div className={`flex items-center p-2 border border-gray-400 rounded-xl my-1 
            ${term.evidenceType === 'direct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="w-14">
              <Tooltip title={EVIDENCE_TYPE_MAP[term.evidenceType]?.iconTooltip}>
                <div className="relative w-12 h-12">
                  <FaFlask className={`text-2xl absolute top-1 left-1.5 
                    ${term.evidenceType === 'direct' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`absolute right-0.5 bottom-0 text-xs font-bold
                    ${term.evidenceType === 'direct' ? 'text-green-700' : 'text-red-700'}`}>
                    {EVIDENCE_TYPE_MAP[term.evidenceType]?.shorthand}
                  </span>
                </div>
              </Tooltip>
            </div>
            <div className="flex-1">
              <span className="mr-1">{term.label}</span>
              {term.displayId && (
                <a href={`${ENVIRONMENT.amigoTermUrl}${term.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="italic text-gray-600">
                  {term.displayId}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
      {terms.length > gene.maxTerms && (
        <button onClick={() => handleExpandClick(gene)}
          className="mt-2 text-blue-600 hover:text-blue-800">
          — View {terms.length - gene.maxTerms} more terms
        </button>
      )}
    </>
  );

  if (isLoading) return (
    <div className="fixed inset-0 bg-gray-600/40 flex items-center justify-center">
      <CircularProgress />
    </div>
  );

  if (error) return <div>Error loading genes</div>;

  return (
    <div className="w-full p-3">
      <div className="h-16 bg-white flex items-center mb-4">
        <h2 className="text-4xl font-medium text-gray-600 pl-3">
          Results (<strong>{geneCount || 'Loading...'}</strong> genes)
        </h2>
      </div>

      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-t border-accent-700">
                <th className="w-10"></th>
                {cols.map(header => (
                  <th key={header} className="p-3 text-left text-xs font-bold uppercase border-r border-gray-300">
                    <Tooltip title={header}>
                      <span>{header}</span>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {genes.map((gene: Gene) => (
                <tr key={gene.gene} className="border-b border-gray-300">
                  <td className="p-3">
                    <button onClick={() => handleExpandClick(gene)}
                      className="text-gray-700">
                      {gene.expanded ? <FaCaretDown /> : <FaCaretRight />}
                    </button>
                  </td>
                  <td className="p-3 border-r border-gray-300">
                    <div className="space-y-1">
                      <div className="font-bold">
                        <a href={`/gene/${gene.gene}`}>{gene.geneSymbol}</a>
                        (<a href={`${ENVIRONMENT.taxonApiUrl}${gene.taxonId}`}>{gene.taxonAbbr}</a>)
                      </div>
                      <div className="text-sm text-gray-600">{gene.geneName}</div>
                      <div className="text-sm">
                        <a href={getUniprotLink(gene)}>{gene.gene}</a>
                      </div>
                      {gene.coordinatesChrNum && (
                        <div className="inline-block px-2 py-0.5 bg-purple-800  text-xs">
                          <a className="text-accent-500" href={`${ENVIRONMENT.ucscUrl}${gene.coordinatesChrNum}:${gene.coordinatesStart}-${gene.coordinatesEnd}`}>
                            chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-{gene.coordinatesEnd}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">{renderTerms(gene.mfs, gene)}</td>
                  <td className="p-3 border-r w-1/5 border-gray-300">{renderTerms(gene.bps, gene)}</td>
                  <td className="p-3 border-r w-1/5 border-gray-300">{renderTerms(gene.ccs, gene)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {geneCount > 0 && (
          <TablePagination
            component="div"
            count={geneCount}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, newPage) => {
              // TODO: Handle page change
            }}
            onRowsPerPageChange={(event) => {
              // TODO: Handle rows per page change
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Genes;