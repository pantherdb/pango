import { Paper, CircularProgress, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { FaDna, FaChartBar, FaQuestion } from "react-icons/fa";
import { useGetAnnotationStatsQuery } from "../annotations/annotationsApiSlice";
import { useGetGenesCountQuery } from "./genesApiSlice";
import { useAppDispatch, useAppSelector } from "../hooks";
import type { RootState } from "../store/store";

const SummaryStats: React.FC = () => {
  const dispatch = useAppDispatch();
  const geneFilter = useAppSelector((state: RootState) => state.genes.filterArgs);
  const annotationFilter = useAppSelector((state: RootState) => state.annotations.filterArgs);

  const { data: annotationStats, isLoading: statsLoading } = useGetAnnotationStatsQuery(annotationFilter);
  const { data: geneCount, isLoading: countLoading } = useGetGenesCountQuery(geneFilter);


  const knowledgeCount = {
    known: 0,
    unknown: 0,
  };

  if (annotationStats?.termTypeFrequency?.buckets) {
    annotationStats.termTypeFrequency.buckets.forEach(bucket => {
      knowledgeCount[bucket.key as keyof typeof knowledgeCount] = bucket.docCount;
    });
  }

  const StatCard: React.FC<{
    value: number;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    loading?: boolean;
  }> = ({ value, label, sublabel, icon, loading }) => (
    <Paper className="p-6 mr-5 bg-[#daead6] rounded-xl w-[250px] h-[120px] flex flex-col items-center justify-center">
      <Box className="flex items-center mb-2">
        {icon}
      </Box>
      {loading ? (
        <CircularProgress size={40} className="my-4" />
      ) : (
        <Typography variant="h3" className="text-4xl text-blue-grey-500 font-bold">
          {value.toLocaleString()}
        </Typography>
      )}
      <Typography variant="subtitle1" className="text-base">
        {label}
      </Typography>
      {sublabel && (
        <Typography variant="caption" className="text-xs text-gray-600">
          {sublabel}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Box className="w-full">
      <Paper className="p-4">
        <Typography variant="h6" className="mb-4 px-2">
          Current Selections
        </Typography>

        <Box className="flex flex-row flex-wrap gap-4 p-2">
          <StatCard
            value={geneCount?.total || 0}
            label="Genes"
            icon={<FaDna size={24} className="text-blue-grey-500" />}
            loading={countLoading}
          />

          <StatCard
            value={knowledgeCount.known}
            label="Annotations"
            sublabel="(functional characteristics)"
            icon={<FaChartBar size={24} className="text-blue-grey-500" />}
            loading={statsLoading}
          />

          <StatCard
            value={knowledgeCount.unknown}
            label="Unknown function aspects"
            icon={<FaQuestion size={24} className="text-blue-grey-500" />}
            loading={statsLoading}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SummaryStats;