import type { Booking } from '@libs/types';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import DotsVerticalIcon from '@untitled-ui/icons-react/build/esm/DotsVertical';
import PropTypes from 'prop-types';
import { useCallback, useState, type ChangeEvent, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { bookingApi } from 'src/api/booking';
import { useDialog } from 'src/hooks/use-dialog';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { usePopover } from 'src/hooks/use-popover';
import { paths } from 'src/paths';
import { timestampToDate } from 'src/utils/date-locale';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { BookingDeleteDialog } from './booking-delete-dialog';
import { BookingListTableMenu } from './booking-list-table-menu';

interface BookingListTableRowProps {
  booking: Booking;
  isSelected?: boolean;
  onSelectOne?: (bookingId: number) => void;
  onDeselectOne?: (bookingId: number) => void;
  onRefresh?: () => void;
}

export const BookingListTableRow: FC<BookingListTableRowProps> = (props) => {
  const { booking, isSelected, onSelectOne, onDeselectOne, onRefresh } = props;
  const popover = usePopover<HTMLButtonElement>();
  const deleteDialog = useDialog<Booking>();
  const router = useRouter();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const bookingDocumentLink = replaceIdPath(
    paths.bookings.documents,
    ':bookingId',
    booking.BookingId
  );
  const bookingEditLink = replaceIdPath(paths.bookings.edit, ':bookingId', booking.BookingId);

  const handleGenerateVoucher = useCallback((): void => {
    popover.handleClose();
    // TODO: Add generate voucher functionality
    console.log(`Generating voucher here for booking ${booking.CustomerName}`);
  }, [booking.CustomerName, popover]);

  const handleOpenDeleteDialog = useCallback((): void => {
    popover.handleClose();
    deleteDialog.handleOpen();
  }, [deleteDialog, popover]);

  const handleDelete = useCallback(async (): Promise<void> => {
    try {
      setIsDeleting(true);
      const response = await bookingApi.deleteBooking({
        bookingId: booking.BookingId,
        createdBy: user?.email || 'system'
      });

      toast.success(response.message || 'Booking deleted successfully');
      deleteDialog.handleClose();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast.error(error?.message || 'Failed to delete booking');
    } finally {
      setIsDeleting(false);
    }
  }, [booking.BookingId, deleteDialog, onRefresh, user]);

  return (
    <>
      <TableRow
        hover
        key={booking.BookingId}
        selected={isSelected}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => {
              if (event.target.checked) {
                onSelectOne?.(booking.BookingId);
              } else {
                onDeselectOne?.(booking.BookingId);
              }
            }}
            value={isSelected}
          />
        </TableCell>
        <TableCell>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            {booking.CustomerName}
          </Stack>
        </TableCell>
        <TableCell>{booking.PickUpDate && timestampToDate(booking.PickUpDate)}</TableCell>
        <TableCell>{booking.DropOffDate && timestampToDate(booking.DropOffDate)}</TableCell>
        <TableCell>{booking.Price}</TableCell>
        <TableCell>
          {booking.Car?.Model || (booking as any).Model} -{' '}
          {booking.Car?.CarNumber || (booking as any).CarNumber}
        </TableCell>
        <TableCell>{booking.SpecialRequest}</TableCell>
        <TableCell>{booking.CreatedOn && timestampToDate(booking.CreatedOn)}</TableCell>
        <TableCell align="right">
          <IconButton
            onClick={popover.handleOpen}
            ref={popover.anchorRef}
          >
            <SvgIcon fontSize="small">
              <DotsVerticalIcon />
            </SvgIcon>
          </IconButton>
        </TableCell>
      </TableRow>
      <BookingListTableMenu
        anchorEl={popover.anchorRef.current}
        bookingDocumentLink={bookingDocumentLink}
        bookingEditLink={bookingEditLink}
        handleGenerateVoucher={handleGenerateVoucher}
        onClose={popover.handleClose}
        onDeleteDialogOpen={handleOpenDeleteDialog}
        open={popover.open}
      />
      <BookingDeleteDialog
        data={booking}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />
    </>
  );
};

BookingListTableRow.propTypes = {
  // @ts-ignore
  booking: PropTypes.object,
  isSelected: PropTypes.bool,
  onSelectOne: PropTypes.func,
  onDeselectOne: PropTypes.func
};
