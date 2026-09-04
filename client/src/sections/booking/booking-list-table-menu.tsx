import Menu from '@mui/material/Menu';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import CircularProgress from '@mui/material/CircularProgress';
import Edit02Icon from '@untitled-ui/icons-react/build/esm/Edit02';
import FileAttachment04 from '@untitled-ui/icons-react/build/esm/FileAttachment04';
import Ticket01 from '@untitled-ui/icons-react/build/esm/Ticket01';
import Trash02Icon from '@untitled-ui/icons-react/build/esm/Trash02';
import { hasPermission } from '@libs/permissions';
import PropTypes from 'prop-types';
import type { FC } from 'react';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';

interface BookingListTableMenuProps {
  anchorEl?: HTMLElement | null;
  bookingDocumentLink: string;
  bookingEditLink: string;
  handleGenerateVoucher?: () => void;
  isGeneratingVoucher?: boolean;
  onClose?: () => void;
  onDeleteDialogOpen?: () => void;
  open?: boolean;
}

export const BookingListTableMenu: FC<BookingListTableMenuProps> = (props) => {
  const {
    anchorEl,
    bookingEditLink,
    bookingDocumentLink,
    onDeleteDialogOpen,
    handleGenerateVoucher,
    isGeneratingVoucher = false,
    onClose,
    open = false
  } = props;
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'Bookings', 'Edit');
  const canDelete = hasPermission(user, 'Bookings', 'Delete');

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'bottom'
      }}
      onClose={onClose}
      open={open}
      sx={{
        [`& .${menuItemClasses.root}`]: {
          fontSize: 14,
          '& svg': {
            mr: 1
          }
        }
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top'
      }}
    >
      {canEdit && (
        <MenuItem
          component={RouterLink}
          href={bookingEditLink}
        >
          <SvgIcon fontSize="small">
            <Edit02Icon />
          </SvgIcon>
          Edit
        </MenuItem>
      )}
      <MenuItem
        component={RouterLink}
        href={bookingDocumentLink}
      >
        <SvgIcon fontSize="small">
          <FileAttachment04 />
        </SvgIcon>
        View Documents
      </MenuItem>
      <MenuItem
        onClick={handleGenerateVoucher}
        disabled={isGeneratingVoucher}
      >
        {isGeneratingVoucher ? (
          <CircularProgress
            size={16}
            sx={{ mr: 1 }}
          />
        ) : (
          <SvgIcon fontSize="small">
            <Ticket01 />
          </SvgIcon>
        )}
        {isGeneratingVoucher ? 'Generating...' : 'Generate Voucher'}
      </MenuItem>
      {canDelete && (
        <MenuItem
          onClick={onDeleteDialogOpen}
          sx={{ color: 'error.main' }}
        >
          <SvgIcon fontSize="small">
            <Trash02Icon />
          </SvgIcon>
          Delete
        </MenuItem>
      )}
    </Menu>
  );
};

BookingListTableMenu.propTypes = {
  anchorEl: PropTypes.any,
  // @ts-ignore
  bookingEditLink: PropTypes.string,
  // @ts-ignore
  bookingDocumentLink: PropTypes.string,
  handleDelete: PropTypes.func,
  handleGenerateVoucher: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool
};
