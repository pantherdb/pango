import {
  Gauge,
  gaugeClasses,
} from '@mui/x-charts/Gauge';
import { Box } from '@mui/material';
import type React from 'react';

interface GaugeData {
  value: number;
  max?: number;
  color: string;
  icon: React.ReactNode;
  iconText?: string;
}

interface ConcentricGaugeProps {
  values: GaugeData[];
  width?: number;
  height?: number;
}

const ConcentricGauge: React.FC<ConcentricGaugeProps> = (props) => {
  const { values, width = 200, height = 200 } = props;

  // These can be adjusted as needed
  const ringWidthPercentage = 10; // 5% of total width for each ring
  const gapSizePixels = 4; // 2px gap between rings

  const gapPercentage = (gapSizePixels / width) * 100;

  const startAngle = -150;
  const endAngle = 150;

  return (
    <Box className="relative" style={{ width, height }}>
      {values.map((gauge, index) => {
        const outerRadiusPercentage = 100 - (index * (ringWidthPercentage + gapPercentage));
        const innerRadiusPercentage = outerRadiusPercentage - ringWidthPercentage;

        return (
          <Box
            key={index}
            className="absolute"
            style={{
              width: width,
              height: height,
              top: 0,
              left: 0
            }}
          >
            <Gauge
              width={width}
              height={height}
              startAngle={startAngle}
              endAngle={endAngle}
              value={gauge.value}
              min={0}
              max={gauge.max || 100}
              innerRadius={`${innerRadiusPercentage}%`}
              outerRadius={`${outerRadiusPercentage}%`}
              sx={{
                [`& .${gaugeClasses.valueArc}`]: {
                  fill: gauge.color,
                },
                [`& .${gaugeClasses.referenceArc}`]: {
                  fill: 'rgba(0, 0, 0, 0.2)',
                },
                [`& .${gaugeClasses.valueText}`]: {
                  display: 'none',
                },
              }}
            />
          </Box>
        );
      })}
      {<Box
        className="absolute flex justify-center items-center"
        style={{ width, height }}
      >
        <div className="flex flex-col">
          {values.map((gauge, index) => (
            <div key={index} className="flex items-center mb-1">
              <span className="text-3xl">{gauge.icon}</span>
              <div color="textSecondary" className="ml-1">
                {gauge.iconText}
              </div>
            </div>
          ))}
        </div>
      </Box>}
    </Box>
  );
};

export type { GaugeData }

export default ConcentricGauge;