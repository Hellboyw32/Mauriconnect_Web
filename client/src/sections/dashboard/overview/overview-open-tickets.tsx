import type { FC } from 'react';
import PropTypes from 'prop-types';
import ArrowRightIcon from '@untitled-ui/icons-react/build/esm/ArrowRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { usePickupsTodayCount } from 'src/hooks/bookings/use-pickups-today-count';
import { paths } from 'src/paths';
import { RouterLink } from 'src/components/router-link';

interface OverviewOpenTicketsProps {
  amount?: number;
}

export const OverviewOpenTickets: FC<OverviewOpenTicketsProps> = (props) => {
  const { count, isLoading } = usePickupsTodayCount();
  const amount = props.amount ?? count;

  return (
    <Card>
      <Stack
        alignItems="center"
        direction={{
          xs: 'column',
          sm: 'row'
        }}
        spacing={3}
        sx={{
          px: 4,
          py: 3
        }}
      >
        <div>
          <img
            src="/assets/iconly/iconly-glass-paper.svg"
            width={48}
          />
        </div>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            Cars Pickup Today
          </Typography>
          {isLoading ? (
            <CircularProgress
              size={24}
              sx={{ mt: 1 }}
            />
          ) : (
            <Typography
              color="text.primary"
              variant="h4"
            >
              {amount}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider />
      <CardActions>
        <Button
          color="inherit"
          component={RouterLink}
          href={paths.bookings.index}
          endIcon={
            <SvgIcon>
              <ArrowRightIcon />
            </SvgIcon>
          }
          size="small"
        >
          {/* See all bookings */}
        </Button>
      </CardActions>
    </Card>
  );
};

OverviewOpenTickets.propTypes = {
  amount: PropTypes.number
};
