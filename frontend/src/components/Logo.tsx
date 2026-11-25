import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Box component={RouterLink} to="/" aria-label="MauriConnect home" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
      <Box component="img" src="/favicon.svg" alt="" sx={{ width: 36, height: 36 }} />
      <Box sx={{ lineHeight: 1 }}>
        <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: light ? '#fff' : 'primary.main' }}>
          Mauri<Box component="span" sx={{ color: 'secondary.main' }}>Connect</Box>
        </Typography>
        <Typography component="span" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', color: light ? 'rgba(255,255,255,.75)' : 'text.secondary' }}>
          CAR RENTAL MAURITIUS
        </Typography>
      </Box>
    </Box>
  );
}
