import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { FC } from 'react';

interface LockConfirmDialogProps {
  open: boolean;
  username?: string;
  action: 'lock' | 'unlock';
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LockConfirmDialog: FC<LockConfirmDialogProps> = (props) => {
  const { open, username, action, isSubmitting, onClose, onConfirm } = props;
  const isLock = action === 'lock';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{isLock ? 'Lock account' : 'Unlock account'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isLock
            ? `Are you sure you want to lock "${username}"'s account? The user will no longer be able to log in until an administrator unlocks the account.`
            : `Are you sure you want to unlock "${username}"'s account? The user will be able to log in again.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          color="inherit"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isLock ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isLock ? 'Lock Account' : 'Unlock Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
