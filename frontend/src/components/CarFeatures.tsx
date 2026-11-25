import AcUnitIcon from '@mui/icons-material/AcUnit';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import LuggageOutlinedIcon from '@mui/icons-material/LuggageOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import type { Car } from '../types/api';

type Features = Pick<Car, 'transmission' | 'passengers' | 'doors' | 'luggage' | 'airConditioning' | 'fuelType'>;

export function CarFeatures({ car, dense = false }: { car: Features; dense?: boolean }) {
  const items = [
    { icon: <SettingsOutlinedIcon />, label: car.transmission, title: 'Transmission' },
    { icon: <PersonOutlineIcon />, label: `${car.passengers} seats`, title: 'Passengers' },
    { icon: <MeetingRoomOutlinedIcon />, label: `${car.doors} doors`, title: 'Doors' },
    { icon: <LuggageOutlinedIcon />, label: `${car.luggage} bag${car.luggage === 1 ? '' : 's'}`, title: 'Luggage capacity (large suitcases)' },
    ...(car.airConditioning ? [{ icon: <AcUnitIcon />, label: 'Air con', title: 'Air conditioning' }] : []),
    { icon: <LocalGasStationOutlinedIcon />, label: car.fuelType, title: 'Fuel type' },
  ];
  return (
    <Box component="ul" sx={{ display: 'grid', gridTemplateColumns: dense ? 'repeat(3, auto)' : 'repeat(3, minmax(0, 1fr))', gap: dense ? 0.75 : 1.25, p: 0, m: 0, listStyle: 'none' }}>
      {items.map((item) => (
        <Tooltip key={item.title} title={item.title} placement="top">
          <Stack component="li" direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', '& svg': { fontSize: 18, color: 'primary.main' } }}>
            {item.icon}
            <Typography variant="body2" noWrap>
              {item.label}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Box>
  );
}
