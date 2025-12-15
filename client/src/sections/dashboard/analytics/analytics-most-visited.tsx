import type { FC } from 'react';
import numeral from 'numeral';
import InfoCircleIcon from '@untitled-ui/icons-react/build/esm/InfoCircle';
import RefreshCcw01Icon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Scrollbar } from 'src/components/scrollbar';
import { useTopRentedCars } from 'src/hooks/cars/use-top-rented-cars';

export const AnalyticsMostVisited: FC = () => {
  const { cars, isLoading, refetch } = useTopRentedCars(8);

  console.log('Component render - cars:', cars);
  console.log('Component render - isLoading:', isLoading);
  console.log('Component render - cars.length:', cars?.length);

  return (
    <Card>
      <CardHeader
        title="Top Rented Cars"
        action={
          <Stack
            direction="row"
            spacing={1}
          >
            <Tooltip title="Active cars sorted by rental count">
              <SvgIcon color="action">
                <InfoCircleIcon />
              </SvgIcon>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                onClick={refetch}
                size="small"
                disabled={isLoading}
              >
                <SvgIcon fontSize="small">
                  {isLoading ? <CircularProgress size={20} /> : <RefreshCcw01Icon />}
                </SvgIcon>
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      <Scrollbar>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Car Number</TableCell>
              <TableCell>Car Model</TableCell>
              <TableCell>Current Mileage</TableCell>
              <TableCell align="right">Times Rented</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow key="loading">
                <TableCell
                  colSpan={4}
                  align="center"
                >
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : cars.length === 0 ? (
              <TableRow key="empty">
                <TableCell
                  colSpan={4}
                  align="center"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    No rental data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cars.map((car) => {
                const mileage = numeral(car.CurrentMileage).format('0,0');

                return (
                  <TableRow
                    key={car.CarId}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {car.CarNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{car.Model}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{mileage} km</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {car.RentalCount}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
};
