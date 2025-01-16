import type React from 'react';
import { useState } from 'react';
import { Box, Drawer, Button, Chip, Tooltip } from '@mui/material';
import { MdCancel } from 'react-icons/md';
import { SearchFilterType } from '../annotations/models/annotation';
import Genes from '../genes/Genes';
import SummaryStats from '../genes/GeneStats';
import GeneForm from '../genes/forms/GeneForm';
import OverrepForm from '../genes/forms/OverrepForm';

const Home: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    filtersCount: 0,
    [SearchFilterType.GENES]: [],
    [SearchFilterType.SLIM_TERMS]: [],
    [SearchFilterType.ASPECTS]: [],
  });

  const clearAllFilters = () => {
    setSearchCriteria({
      filtersCount: 0,
      [SearchFilterType.GENES]: [],
      [SearchFilterType.SLIM_TERMS]: [],
      [SearchFilterType.ASPECTS]: [],
    });
  };

  const removeFilter = (filterType: SearchFilterType) => {
    setSearchCriteria(prev => ({
      ...prev,
      [filterType]: [],
      filtersCount: prev.filtersCount - 1
    }));
  };

  return (
    <Box className="w-full flex flex-col">
      <div className="bg-gradient-to-r from-[#00174f] to-[rgba(0,23,79,0.5)] bg-cover bg-top relative h-[350px] min-w-[800px] max-h-[400px] p-5"
        style={{
          backgroundImage: `linear-gradient(to right, #00174f, rgba(0,23,79,0.8), rgba(0,23,79,0.5)), url('/assets/images/gene.jpeg')`
        }}>
        <div className="flex">
          <div className="w-3/5">
            <h1 className="text-2xl font-bold tracking-wider text-white mb-2">
              Functions of Human Genes
            </h1>
            <h2 className="text-sm font-medium tracking-wide text-white max-w-lg">
              The table below shows, for each human protein-coding gene, the set of functional characteristics
              that have been assigned based on expert review and integration of available experimental evidence
              in 6,333 families of protein-coding genes.
            </h2>
            <div className="mt-3 flex items-center">
              <GeneForm />
              <h3 className="ml-3 text-xs text-white">
                See any missing or incorrect functions?
                <a href="https://help.geneontology.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#69f0ae] hover:text-[#81ffc0] ml-1">
                  Let us know!
                </a>
              </h3>
            </div>
          </div>
          <div className="w-2/5 p-3">
            <h2 className="text-white text-sm font-medium">
              PAN-GO Enrichment Analysis
              <span className="ml-2">ⓘ</span>
            </h2>
            <OverrepForm />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-white shadow-md px-3 h-[30px] flex items-center">
        {searchCriteria.filtersCount === 0 ? (
          <span className="text-gray-500 italic text-xs">
            No Filters selected: You can filter the list to find a specific gene or function category.
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <small className="mr-3 text-xs">Filtered By:</small>
            <Chip
              label="Clear All"
              onDelete={clearAllFilters}
              className="h-6 text-xs"
              color="error"
              size="small"
            />
            {searchCriteria[SearchFilterType.GENES].length > 0 && (
              <Tooltip title="Click to remove genes filter" placement="bottom">
                <Chip
                  label={`Genes (${searchCriteria[SearchFilterType.GENES].length})`}
                  onDelete={() => removeFilter(SearchFilterType.GENES)}
                  className="h-6 text-xs"
                  size="small"
                />
              </Tooltip>
            )}
          </div>
        )}
      </div>

      <Box className="min-h-[500px] mb-[200px]">
        <SummaryStats />
        <Genes />
      </Box>
    </Box>
  );
};

export default Home;