import type React from 'react';
import { useEffect, useMemo } from 'react';
import { Box, } from '@mui/material';
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import GeneForm from '@/features/genes/components/forms/GeneForm';
import OverrepForm from '@/features/genes/components/forms/OverrepForm';
import Genes from '@/features/genes/components/Genes';
import { useAppDispatch, useAppSelector } from './hooks';
import FilterSummary from '@/features/search/components/FilterSummary';
import type { RootState } from './store/store';
import { useGetGenesStatsQuery } from '@/features/genes/slices/genesApiSlice';
import { transformCategoryTerms } from '@/features/terms/services/termsService';
import { setFunctionCategories } from '@/features/terms/slices/termsSlice';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();

  const search = useAppSelector((state: RootState) => state.search);
  const filter = useMemo(() => ({
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id)
  }), [search.genes, search.slimTerms]);


  const { data: statsData, isSuccess } = useGetGenesStatsQuery({ filter });

  useEffect(() => {
    if (isSuccess && statsData) {
      const categoryTerms = transformCategoryTerms(statsData.slimTermFrequency?.buckets || []);
      dispatch(setFunctionCategories(categoryTerms));
    }
  }, [statsData, isSuccess, dispatch]);

  useEffect(() => {
    dispatch(setLeftDrawerOpen(true));
  }, [dispatch]);

  return (
    <Box className="w-full flex flex-col">
      <div className="bg-gradient-to-r from-[#00174f] to-[rgba(0,23,79,0.5)] bg-cover bg-top relative h-[350px] min-w-[800px] max-h-[400px] p-5 pt-10"
        style={{
          backgroundImage: `linear-gradient(to right, #00174f, rgba(0,23,79,0.8), rgba(0,23,79,0.5)), url('/assets/images/gene.jpeg')`
        }}>
        <div className="flex">
          <div className="w-3/5 flex-col">
            <h1 className="text-4xl font-bold tracking-wider text-white mb-4">
              Functions of Human Genes
            </h1>
            <h2 className="text-lg leading-7 font-medium tracking-wider text-white mb-10 max-w-2xl">
              The table below shows, for each human protein-coding gene, the set of functional characteristics
              that have been assigned based on expert review and integration of available experimental evidence
              in 6,333 families of protein-coding genes.
              ( <Link to="/about" className="text-accent-500 hover:text-accent-200"> Read More</Link> ).

              Each characteristic is linked to the experimental evidence supporting
            </h2>
            <div className='flex items-center'>
              <div className='w-[300px] mr-4'>
                <GeneForm />
              </div>

              <h3 className="text-xs text-white">
                See any missing or incorrect functions?
                <a href="https://help.geneontology.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-500 hover:text-accent-200 px-1">
                  Let us know!
                </a>
              </h3>
            </div>    </div>
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
        <FilterSummary />
      </div>

      <Box className="min-h-[500px] mb-[200px]">
        <Genes />
      </Box>
    </Box>
  );
};

export default Home;