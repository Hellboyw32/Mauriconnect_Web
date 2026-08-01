import type { RoadTax } from '@libs/types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import AlertTriangleIcon from '@untitled-ui/icons-react/build/esm/AlertTriangle';
import type { FC } from 'react';

interface RoadTaxDeleteDialogProps {
  roadTax?: RoadTax;
  onClose?: () => void;
  onDelete?: () => void;
  open?: boolean;
  isDeleting?: boolean;
}

export const RoadTaxDeleteDialog: FC<RoadTaxDeleteDialogProps> = (props) => {
  const { roadTax, onClose, onDelete, open = false, isDeleting = false } = props;

  if (!roadTax) {
    return null;
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <Paper elevation={12}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            display: 'flex',
            p: 3
          }}
        >
          <Avatar
            sx={{
              backgroundColor: 'error.lightest',
              color: 'error.main'
            }}
          >
            <SvgIcon>
              <AlertTriangleIcon />
            </SvgIcon>
          </Avatar>
          <div>
            <Typography variant="h5">Delete road tax record</Typography>
            <Typography
              variant="h6"
              sx={{ mt: 1 }}
            >
              {roadTax.Car?.Model} ({roadTax.Car?.CarNumber})
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
              variant="body2"
            >
              Are you sure you want to delete this road tax record? It will be marked as inactive.
              This action cannot be undone.
            </Typography>
          </div>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            pb: 3,
            px: 3
          }}
        >
          <Button
            color="inherit"
            onClick={onClose}
            sx={{ mr: 2 }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            sx={{
              backgroundColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
            variant="contained"
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress
                  size={20}
                  color="inherit"
                />
              ) : null
            }
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Paper>
    </Dialog>
  );
};
