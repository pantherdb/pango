import { Paper, Typography, Chip } from "@mui/material";
import { Box } from "@mui/system";
import { useAppSelector } from "../hooks";
import type { RootState } from "../store/store";
import { useGetGenesStatsQuery } from "./genesApiSlice";
import { ASPECT_MAP } from "@/@pango.core/data/config";

interface CategoryItem {
  id: string;
  aspect: string;
  label: string;
  displayId: string;
  count: number;
  color: string;
  aspectShorthand: string;
  width: string;
  countPos: string;
}

const CategoryStats: React.FC = () => {
  const geneFilter = useAppSelector((state: RootState) => state.genes.filterArgs);
  const { data: geneStats } = useGetGenesStatsQuery(geneFilter);

  const buildCategoryBar = (buckets: any[]): CategoryItem[] => {
    if (!buckets?.length) return [];

    const sortedBuckets = [...buckets].sort((a, b) => b.docCount - a.docCount);
    const longest = sortedBuckets[0].docCount;

    return sortedBuckets.map((bucket) => {
      const ratio = bucket.docCount / longest;
      let countPos;

      if (ratio < 0.20) {
        countPos = `${ratio * 100}%`;
      } else if (ratio < 0.90) {
        countPos = `${(ratio - 0.15) * 100}%`;
      } else {
        countPos = `${(ratio - 0.30) * 100}%`;
      }

      return {
        ...bucket.meta,
        name: bucket.key,
        count: bucket.docCount,
        color: ASPECT_MAP[bucket.meta.aspect]?.color,
        aspectShorthand: ASPECT_MAP[bucket.meta.aspect]?.shorthand,
        width: `${ratio * 100}%`,
        countPos
      };
    });
  };

  const slimTermFrequency = geneStats?.slimTermFrequency?.buckets ?
    buildCategoryBar(geneStats.slimTermFrequency.buckets) : [];

  return (
    <Box className="w-full">
      <Paper className="h-full">
        <Box className="p-4 border-b border-gray-200">
          <Typography variant="h6">
            GO Function Category Distribution
          </Typography>
        </Box>

        <Box className="p-4">
          {slimTermFrequency.map((item) => (
            <Box
              key={item.id}
              className="flex items-center py-2 border-b border-gray-300 cursor-pointer hover:bg-gray-50"
            >
              <Chip
                label={item.aspectShorthand}
                className="mr-4 text-[8px] font-bold"
                size="small"
                style={{
                  border: `1px solid ${item.color}`,
                  color: item.color,
                  height: '18px',
                  width: '18px',
                  padding: '2px'
                }}
              />

              <Box className="w-[100px]">
                <Typography className="text-[12px] truncate">
                  {item.label}
                </Typography>
                <Typography className="text-[8px] text-gray-500 italic truncate">
                  {item.displayId}
                </Typography>
              </Box>

              <Box className="flex-1 relative h-5">
                <Box
                  className="h-5 absolute"
                  style={{
                    backgroundColor: item.color,
                    width: item.width
                  }}
                />
                <Box
                  className="absolute px-1 text-[8px] bg-gray-100 border border-gray-800 rounded-lg"
                  style={{ left: item.countPos, top: '5px' }}
                >
                  {item.count} genes
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default CategoryStats;