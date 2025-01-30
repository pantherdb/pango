import type React from 'react';
import { useMemo, useState } from 'react';
import { Checkbox, Tooltip } from '@mui/material';
import type { AspectMapType } from "@/@pango.core/data/config";
import { ASPECT_MAP } from "@/@pango.core/data/config";
import { SearchFilterType } from '@/features/search/search';
import { addItem } from '@/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useGetGenesStatsQuery } from '@/features/genes/slices/genesApiSlice';
import type { RootState } from '@/app/store/store';
import TermFilterForm from '@/features/terms/components/TermFilterForm';

// TODO: Prettification

const CategoryStats: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedAspects, setSelectedAspects] = useState<string[]>(Object.values(ASPECT_MAP).map(aspect => aspect.id));
  const search = useAppSelector((state: RootState) => state.search);
  const filter = {
    geneIds: search.genes.map(g => g.gene),
    slimTermIds: search.slimTerms.map(t => t.id)
  };

  const { data: geneStats } = useGetGenesStatsQuery({ filter });
  const categories = useAppSelector(state => state.terms.functionCategories);

  const filteredCategories = useMemo(() =>
    categories.filter(cat => selectedAspects.includes(cat.aspect)),
    [categories, selectedAspects]
  );


  const toggleAspect = (aspectId: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId)
        ? prev.filter(id => id !== aspectId)
        : [...prev, aspectId]
    );
  };




  return (
    <div className="w-full">
      <div className="h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium">GO Function Category Distribution</h3>
        </div>

        <div className='w-[full p-4'>
          <TermFilterForm />
        </div>

        <div className="p-4">
          <h5 className="mb-4">Show/hide GO aspects in category list below</h5>

          <div className="flex flex-wrap gap-4 mb-6">
            {Object.values(ASPECT_MAP).map((aspect: AspectMapType) => (
              <Tooltip
                key={aspect.id}
                title={aspect.description}
                placement="top"
                enterDelay={1500}
              >
                <div
                  className="flex items-center gap-2 p-2 rounded cursor-pointer"
                  style={{
                    backgroundColor: selectedAspects.includes(aspect.id)
                      ? `${aspect.color}50`
                      : '#EEEEEE'
                  }}
                  onClick={() => toggleAspect(aspect.id)}
                >
                  <Checkbox
                    checked={selectedAspects.includes(aspect.id)}
                    onChange={() => toggleAspect(aspect.id)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{
                      color: `${aspect.color}50`,
                      '&.Mui-checked': {
                        color: aspect.color,
                      },
                    }}
                  />
                  <img
                    src={`assets/images/activity/${aspect.icon}.png`}
                    alt={aspect.label}
                    className="w-6 h-6"
                  />
                  <span className="text-sm">{aspect.shorthand}</span>
                </div>
              </Tooltip>
            ))}
          </div>

          {filteredCategories.map((item) => (
            <div
              key={item.id}
              className="flex items-center py-2 border-b border-gray-300 cursor-pointer hover:bg-gray-50"
              onClick={() => dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item }))}
            >
              <div
                className="mr-4 rounded-full text-xs font-extrabold h-9 w-9 flex items-center justify-center"
                style={{
                  border: `1px solid ${item.color}50`,
                  color: item.color,
                  backgroundColor: `${item.color}20`
                }}
              >
                {item.aspectShorthand}
              </div>
              <div className="w-[100px]">
                <div className="text-xs truncate">{item.label}</div>
                <div className="text-xs text-gray-500 italic truncate">
                  {item.displayId}
                </div>
              </div>
              <div className="flex-1 relative h-9">
                <div
                  className="h-full absolute"
                  style={{
                    backgroundColor: item.color,
                    width: item.width
                  }}
                />
                <div
                  className="absolute px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg transform -translate-y-1/2"
                  style={{
                    left: item.countPos,
                    top: '50%'
                  }}
                >
                  {item.count} genes
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryStats;