import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps } from '@mui/system/styleFunctionSx';
import PropTypes from 'prop-types';
import type { FC } from 'react';

interface TenantSwitchProps {
  sx?: SxProps;
}

export const TenantSwitch: FC<TenantSwitchProps> = (props) => {
  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
        {...props}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            color="inherit"
            variant="h6"
          >
            Inncars Portal
          </Typography>
          <Typography
            color="neutral.400"
            variant="body2"
          >
            Development
          </Typography>
        </Box>
      </Stack>
    </>
  );
};

TenantSwitch.propTypes = {
  // @ts-ignore
  sx: PropTypes.object
};
