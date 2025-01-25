import type { FC } from 'react';
import { TablePagination, CircularProgress, Tooltip } from '@mui/material';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';
import { useGetGenesCountQuery, useGetGenesQuery } from './genesApiSlice';
import type { Gene } from './models/gene';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import { useAppSelector } from '../hooks';
import type { RootState } from '../store/store';
import Terms from './Terms';

// TODO: Add expand genes

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

  const { data: geneData, isLoading, error } = useGetGenesQuery({ page, size, filter });
  const { data: countData } = useGetGenesCountQuery({ filter });

  const genes = geneData?.genes ?? [];
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
              <tr className="">
                <th className="w-10"></th>
                {cols.map(header => (
                  <th key={header} className="">
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
                        <a href={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">{gene.geneSymbol} </a>
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

                      <div className="text-sm">
                        <a href={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">
                          View all functions and evidence
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms terms={gene.groupedTerms?.mfs} maxTerms={gene.groupedTerms?.maxTerms} onToggleExpand={handleExpandClick} />
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms terms={gene.groupedTerms?.bps} maxTerms={gene.groupedTerms?.maxTerms} onToggleExpand={handleExpandClick} />
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms terms={gene.groupedTerms?.ccs} maxTerms={gene.groupedTerms?.maxTerms} onToggleExpand={handleExpandClick} />
                  </td>
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