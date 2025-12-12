import type { FC } from 'react';
import type { Booking } from '@libs/types';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import numeral from 'numeral';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { Scrollbar } from 'src/components/scrollbar';
import { useRecentBookings } from 'src/hooks/bookings/use-recent-bookings';

interface OverviewTransactionsProps {
  limit?: number;
}

export const OverviewTransactions: FC<OverviewTransactionsProps> = (props) => {
  const { limit } = props;
  const { bookings, isLoading } = useRecentBookings(limit);

  return (
    <Card>
      <CardHeader
        title="Recent Bookings"
        subheader="Latest bookings created"
        sx={{ pb: 0 }}
      />
      <Divider />
      {isLoading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <CircularProgress />
        </Stack>
      ) : !bookings || bookings.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <Typography
            color="text.secondary"
            variant="body2"
          >
            No recent bookings found
          </Typography>
        </Stack>
      ) : (
        <Scrollbar>
          <Table sx={{ minWidth: 600 }}>
            <TableBody>
              {bookings?.map((booking: Booking) => {
                const pickupDate = new Date(booking.PickUpDate);
                const pickupMonth = format(pickupDate, 'LLL').toUpperCase();
                const pickupDay = format(pickupDate, 'd');
                const price = booking.Price || '0';
                const currency = booking.Currency || 'MUR';

                return (
                  <TableRow
                    key={booking.BookingId}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell width={100}>
                      <Box
                        sx={{
                          p: 1,
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'neutral.800' : 'neutral.100',
                          borderRadius: 2,
                          maxWidth: 'fit-content'
                        }}
                      >
                        <Typography
                          align="center"
                          color="text.primary"
                          variant="caption"
                        >
                          {pickupMonth}
                        </Typography>
                        <Typography
                          align="center"
                          color="text.primary"
                          variant="h6"
                        >
                          {pickupDay}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Typography variant="subtitle2">{booking.CustomerName}</Typography>
                        <Typography
                          color="text.secondary"
                          variant="body2"
                        >
                          {booking.Car?.CarCategory?.Category || (booking as any).Category || 'N/A'}{' '}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Ref: {booking.ReferenceNo || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell width={180}>
                      <Typography
                        color="success.main"
                        variant="subtitle2"
                      >
                        {currency} {numeral(price).format('0,0.00')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Scrollbar>
      )}
    </Card>
  );
};

OverviewTransactions.propTypes = {
  limit: PropTypes.number
};
