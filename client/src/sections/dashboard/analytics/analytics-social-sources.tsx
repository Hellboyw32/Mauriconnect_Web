import type { FC } from 'react';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import type { ApexOptions } from 'apexcharts';
import InfoCircleIcon from '@untitled-ui/icons-react/build/esm/InfoCircle';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Chart } from 'src/components/chart';
import { useCarCategoryDistribution } from 'src/hooks/cars/use-car-category-distribution';

const useChartOptions = (labels: string[]): ApexOptions => {
  const theme = useTheme();

  return {
    chart: {
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: false
      }
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main
    ],
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    labels,
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        expandOnClick: false
      }
    },
    states: {
      active: {
        filter: {
          type: 'none'
        }
      },
      hover: {
        filter: {
          type: 'none'
        }
      }
    },
    stroke: {
      width: 0
    },
    theme: {
      mode: theme.palette.mode
    },
    tooltip: {
      fillSeriesColor: false
    }
  };
};

type ChartSeries = number[];

interface AnalyticsSocialSourcesProps {}

export const AnalyticsSocialSources: FC<AnalyticsSocialSourcesProps> = () => {
  const { categories, isLoading } = useCarCategoryDistribution();

  const labels = categories.map((cat) => cat.Category);
  const chartSeries = categories.map((cat) => cat.TotalCars);
  const chartOptions = useChartOptions(labels);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Car Category Distribution" />
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Car Category Distribution"
        action={
          <Tooltip title="Active cars by category">
            <SvgIcon color="action">
              <InfoCircleIcon />
            </SvgIcon>
          </Tooltip>
        }
      />
      <CardContent>
        <Chart
          height={200}
          options={chartOptions}
          series={chartSeries}
          type="donut"
        />
        <Grid
          container
          spacing={1}
        >
          {chartSeries.map((item, index) => (
            <Grid
              key={index}
              xs={12}
              sm={6}
            >
              <Stack
                alignItems="center"
                direction="row"
                spacing={1}
              >
                <Box
                  sx={{
                    backgroundColor: chartOptions.colors![index],
                    borderRadius: '50%',
                    height: 8,
                    width: 8
                  }}
                />
                <Typography variant="subtitle2">{labels[index]}</Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

AnalyticsSocialSources.propTypes = {};
