import type React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { MdExpandMore, MdChevronRight } from 'react-icons/md';
import { FaFlask } from 'react-icons/fa';
//import { toggleExpand } from '../store/geneSlice';
import { useAppDispatch } from '../hooks';
import { useGetGenesQuery } from './genesApiSlice';
import type { Term } from './models/gene';
import type { Gene } from './models/gene';
import { EVIDENCE_TYPE_MAP } from './data/config';

interface GenesProps {
  pageNumber?: number;
  pageSize?: number;
}

const Genes: React.FC<GenesProps> = ({ pageNumber = 1, pageSize = 50 }) => {
  const { data, isLoading, error } = useGetGenesQuery({ pageNumber, pageSize });
  const genes = data?.genes ?? [];
  const dispatch = useAppDispatch();

  if (isLoading) return <CircularProgress />;
  if (error) return <p>Error loading genes</p>;

  const getUniprotLink = (gene: string) => {
    const geneId = gene?.split(':');
    return geneId.length > 1 ? `https://uniprot.org/uniprot/${geneId[1]}` : gene;
  };

  const getUcscLink = (gene: Gene) => {
    return `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr${gene.coordinatesChrNum}:${gene.coordinatesStart}-${gene.coordinatesEnd}`;
  };

  const renderTerms = (terms: Term[] = [], gene: Gene) => {
    if (!terms?.length) return null;

    return (
      <div className="space-y-2">
        {terms.slice(0, gene.maxTerms).map((term, idx) => (
          <div key={idx} className={`border rounded-lg p-2 ${term.evidenceType === 'D' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              <Tooltip title={EVIDENCE_TYPE_MAP[term.evidenceType].iconTooltip}>
                <div className="relative w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <FaFlask className={term.evidenceType === 'D' ? 'text-green-600' : 'text-red-600'} size={16} />
                  <span className="absolute right-0 bottom-0 text-xs font-bold">
                    {EVIDENCE_TYPE_MAP[term.evidenceType].shorthand}
                  </span>
                </div>
              </Tooltip>
              <div className="flex-1">
                <span className="text-sm">{term.label}</span>
                {term.displayId && (
                  <span className="text-gray-500 italic ml-2">
                    <a href={`https://amigo.geneontology.org/amigo/term/${term.id}`} target="_blank" rel="noopener noreferrer">
                      {term.displayId}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {terms.length > gene.maxTerms && (
          <div className="text-sm text-blue-600 cursor-pointer">
            — View {terms.length - gene.maxTerms} more terms
          </div>
        )}
      </div>
    );
  };

  return (
    <TableContainer component={Paper} className="w-full">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={40}></TableCell>
            <TableCell>
              <Tooltip title="Information about the gene and the protein(s) it encodes">
                <span>Gene</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="Molecular level protein function">
                <span>Molecular Function</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="System functions at cellular level">
                <span>Biological Process</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="Location of protein activity">
                <span>Cellular Component</span>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {genes.map((gene) => (
            <TableRow key={gene.gene}>
              <TableCell></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>
                    <a href={`/gene/${gene.gene}`} className="text-blue-600 hover:underline">
                      {gene.geneSymbol}
                    </a>
                    (<a href={`/taxon/${gene.taxonId}`} className="text-blue-600 hover:underline">
                      {gene.taxonAbbr}
                    </a>)
                  </div>
                  <div className="text-gray-600">{gene.geneName}</div>
                  <div>
                    <a href={getUniprotLink(gene.gene)} className="text-blue-600 hover:underline">
                      {gene.gene}
                    </a>
                  </div>
                  {gene.coordinatesChrNum && (
                    <div className="bg-purple-800 px-2 py-1 inline-block">
                      <a href={getUcscLink(gene)} className="text-yellow-300 text-xs">
                        chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-{gene.coordinatesEnd}
                      </a>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{renderTerms(gene.mfs, gene)}</TableCell>
              <TableCell>{renderTerms(gene.bps, gene)}</TableCell>
              <TableCell>{renderTerms(gene.ccs, gene)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Genes;