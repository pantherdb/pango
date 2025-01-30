import type React from 'react';
import { TablePagination, CircularProgress, Tooltip } from '@mui/material';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';
import { setPage, setPageSize } from '@/features/search/searchSlice';
import { useMemo, useState } from 'react';
import { ENVIRONMENT } from '@/@pango.core/data/constants';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import type { Gene } from '../models/gene';
import { useGetGenesQuery, useGetGenesCountQuery } from '../slices/genesApiSlice';
import type { RootState } from '@/app/store/store';
import Terms from '@/features/terms/components/Terms';
import { VersionedLink } from '@/shared/components/VersionedLink';

interface GenesProps {
  page?: number;
  size?: number;
}

const Genes: React.FC<GenesProps> = () => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { page, size } = useAppSelector((state: RootState) => state.search.pagination);
  const search = useAppSelector((state: RootState) => state.search);
  const dispatch = useAppDispatch();

  const filter = useMemo(() => ({
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id)
  }), [search.genes, search.slimTerms]);

  const { data: geneData, isLoading, error } = useGetGenesQuery({ page, size, filter });
  const { data: countData } = useGetGenesCountQuery({ filter });

  const genes = geneData?.genes ?? [];
  const geneCount = countData?.total || 0;

  const cols = ['Gene', 'Molecular Functions', 'Biological Processes', 'Cellular Components'];

  const handleExpandClick = (gene: Gene) => {
    setExpandedRows(prev => ({
      ...prev,
      [gene.gene]: !prev[gene.gene]
    }));
  };

  const getUniprotLink = (gene: Gene) => {
    const geneId = gene.gene?.split(':');
    return geneId.length > 1 ? `${ENVIRONMENT.uniprotUrl}${geneId[1]}` : gene.gene;
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setPageSize(parseInt(event.target.value, 10)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-gray-600/40 flex items-center justify-center">
      <CircularProgress />
    </div>
  );

  if (error) return <div>Error loading genes</div>;

  return (
    <div className="w-full p-3">
      <div className="h-20 bg-white flex items-center  rounded-t-3xl">
        <h2 className="text-4xl font-medium text-gray-600 pl-3">
          Results (<strong>{geneCount || 'Loading...'}</strong> genes)
        </h2>
      </div>

      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                {cols.map(header => (
                  <th key={header}>
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
                      {expandedRows[gene.gene] ? <FaCaretDown /> : <FaCaretRight />}
                    </button>
                  </td>
                  <td className="p-3 border-r border-gray-300">
                    <div className="space-y-1">
                      <div className="font-bold">
                        <VersionedLink to={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">
                          {gene.geneSymbol}
                        </VersionedLink>
                        (<a href={`${ENVIRONMENT.taxonApiUrl}${gene.taxonId}`} target="_blank" rel="noopener noreferrer">{gene.taxonAbbr}</a>)
                      </div>
                      <div className="text-sm text-gray-600">{gene.geneName}</div>
                      <div className="text-sm">
                        <a href={getUniprotLink(gene)}>{gene.gene}</a>
                      </div>


                      {gene.coordinatesChrNum && (
                        <div className="inline-block px-2 py-0.5 bg-purple-800 text-xs">
                          <a className="text-accent-500" href={`${ENVIRONMENT.ucscUrl}${gene.coordinatesChrNum}:${gene.coordinatesStart}-${gene.coordinatesEnd}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-{gene.coordinatesEnd}
                          </a>
                        </div>
                      )}
                      <div className="text-sm">
                        <VersionedLink to={`/gene/${gene.gene}`} target="_blank" rel="noreferrer">
                          View all functions and evidence
                        </VersionedLink>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms
                      terms={gene.groupedTerms?.mfs}
                      maxTerms={expandedRows[gene.gene] ? 500 : 2}
                      onToggleExpand={() => handleExpandClick(gene)}
                    />
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms
                      terms={gene.groupedTerms?.bps}
                      maxTerms={expandedRows[gene.gene] ? 500 : 2}
                      onToggleExpand={() => handleExpandClick(gene)}
                    />
                  </td>
                  <td className="p-3 border-r w-1/5 border-gray-300">
                    <Terms
                      terms={gene.groupedTerms?.ccs}
                      maxTerms={expandedRows[gene.gene] ? 500 : 2}
                      onToggleExpand={() => handleExpandClick(gene)}
                    />
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
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        )}
      </div>
    </div>
  );
};

export default Genes;