import type { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  Tooltip
} from '@mui/material';
import { FaFlask, FaCaretRight, FaCaretDown } from 'react-icons/fa';
import { useGetGenesQuery } from './genesApiSlice';
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

  const { data, isLoading, error } = useGetGenesQuery({
    page,
    size,
    filter
  });

  const genes = data?.genes ?? [];

  console.log('Genes:', genes);

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
          <div className={`flex items-center p-2 border rounded-md my-1 
            ${term.evidenceType === 'direct' ? 'bg-green-50' : 'bg-red-50'}
            border-gray-300`}>
            <div className="w-10">
              <Tooltip
                title={<span>{EVIDENCE_TYPE_MAP[term.evidenceType]?.iconTooltip}</span>}
                placement="top"
              >
                <div className="relative w-[30px] h-[30px] rounded-full border">
                  <div className="flex flex-col items-center">
                    <FaFlask className={`text-base ${term.evidenceType === 'direct' ?
                      'text-green-500' : 'text-red-500'}`} />
                    <span className="absolute right-[1px] bottom-0 text-xs font-bold
                      ${term.evidenceType === 'direct' ? 'text-green-700' : 'text-red-700'}">
                      {EVIDENCE_TYPE_MAP[term.evidenceType]?.shorthand}
                    </span>
                  </div>
                </div>
              </Tooltip>
            </div>
            <div className="flex-1">
              <span className="mr-1 text-black font-normal">{term.label}</span>
              {term.displayId && (
                <a
                  href={`${ENVIRONMENT.amigoTermUrl}${term.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="italic text-gray-600"
                >
                  {term.displayId}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
      {terms.length > gene.maxTerms && (
        <div className="mt-2">
          <button
            onClick={() => handleExpandClick(gene)}
            className="text-blue-600 hover:text-blue-800"
          >
            — View {terms.length - gene.maxTerms} more terms
          </button>
        </div>
      )}
    </>
  );

  if (isLoading) return (
    <div className="absolute inset-0 bg-gray-600/40 z-[1000] flex items-center justify-center">
      <CircularProgress />
    </div>
  );
  if (error) return <div>Error loading genes</div>;

  return (
    <div className="w-full p-3">
      <div className="h-[60px] bg-white rounded-tl-xl rounded-br-xl mb-4">
        <h2 className="text-2xl leading-[30px] text-gray-600 pl-3">
          Results (<strong>{data?.total || 0}</strong> <small>genes</small>)
        </h2>
      </div>
      <TableContainer component={Paper} className="border border-gray-300">
        <Table>
          <TableHead>
            <TableRow className="h-[35px] sticky top-[31px] z-[1] 
              border-t border-b border-pangodark bg-white">
              <TableCell width={50} className="p-0"></TableCell>
              {['Gene', 'Molecular Function', 'Biological Process', 'Cellular Component'].map((header) => (
                <TableCell key={header}
                  className="p-2.5 text-xs font-bold uppercase border-r border-gray-400 
                  max-w-[450px] whitespace-nowrap">
                  <Tooltip title={<span>{header}</span>}>
                    <span>{header}</span>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {genes.map((gene: Gene) => (
              <TableRow key={gene.gene}>
                <TableCell className="p-0 w-10">
                  <button
                    onClick={() => handleExpandClick(gene)}
                    className="p-2 text-pangodark"
                  >
                    {gene.expanded ? <FaCaretDown /> : <FaCaretRight />}
                  </button>
                </TableCell>
                <TableCell className="align-top border-r border-gray-300 max-w-[450px]">
                  <div className="flex flex-col gap-1">
                    <div className="text-gray-700 font-bold">
                      <a href={`/gene/${gene.gene}`} className="cursor-pointer">
                        {gene.geneSymbol}
                      </a>
                      (
                      <a href={`${ENVIRONMENT.taxonApiUrl}${gene.taxonId}`}
                        className="cursor-pointer">
                        {gene.taxonAbbr}
                      </a>
                      )
                    </div>
                    <div className="text-gray-600 text-xs">{gene.geneName}</div>
                    <div className="text-xs">
                      <a href={getUniprotLink(gene)}>{gene.gene}</a>
                    </div>
                    {gene.coordinatesChrNum && (
                      <div className="bg-purple-800 text-accent-500 px-1 py-0.5 inline-block">
                        <a
                          href={`${ENVIRONMENT.ucscUrl}${gene.coordinatesChrNum}:${gene.coordinatesStart}-${gene.coordinatesEnd}`}
                          className="text-[10px]"
                        >
                          chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-{gene.coordinatesEnd}
                        </a>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top border-r border-gray-300 w-1/5 p-2">
                  {renderTerms(gene.mfs, gene)}
                </TableCell>
                <TableCell className="align-top border-r border-gray-300 w-1/5 p-2">
                  {renderTerms(gene.bps, gene)}
                </TableCell>
                <TableCell className="align-top border-r border-gray-300 w-1/5 p-2">
                  {renderTerms(gene.ccs, gene)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page - 1}
          rowsPerPage={size}
          onPageChange={(_, newPage) => {
            // Handle page change
          }}
          onRowsPerPageChange={(event) => {
            // Handle rows per page change
          }}
        />
      </TableContainer>
    </div>
  );
};

export default Genes;