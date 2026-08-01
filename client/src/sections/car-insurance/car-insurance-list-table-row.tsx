import type { CarInsurance } from '@libs/types';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import DotsVerticalIcon from '@untitled-ui/icons-react/build/esm/DotsVertical';
import { useCallback, useState, type ChangeEvent, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { carInsurancesApi } from 'src/api/car-insurance';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { usePopover } from 'src/hooks/use-popover';
import { paths } from 'src/paths';
import { timestampToDate } from 'src/utils/date-locale';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { CarInsuranceDeleteDialog } from './car-insurance-delete-dialog';
import { CarInsuranceListTableMenu } from './car-insurance-list-table-menu';

interface CarInsuranceListTableRowProps {
  carInsurance: CarInsurance;
  isSelected?: boolean;
  onSelectOne?: (carInsuranceId: number) => void;
  onDeselectOne?: (carInsuranceId: number) => void;
  onRefresh?: () => void;
}

export const CarInsuranceListTableRow: FC<CarInsuranceListTableRowProps> = (props) => {
  const { carInsurance, isSelected, onSelectOne, onDeselectOne, onRefresh } = props;
  const popover = usePopover<HTMLButtonElement>();
  const deleteDialog = useDialog<CarInsurance>();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const editLink = replaceIdPath(
    paths.carInsurance.edit,
    ':carInsuranceId',
    carInsurance.CarInsuranceId
  );

  const handleOpenDeleteDialog = useCallback((): void => {
    popover.handleClose();
    deleteDialog.handleOpen(carInsurance);
  }, [carInsurance, deleteDialog, popover]);

  const handleDelete = useCallback(async (): Promise<void> => {
    try {
      setIsDeleting(true);
      const response = await carInsurancesApi.deleteCarInsurance({
        carInsuranceId: carInsurance.CarInsuranceId,
        createdBy: user?.email || 'system'
      });

      toast.success(response.message || 'Car insurance record deleted successfully');
      deleteDialog.handleClose();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete car insurance record');
    } finally {
      setIsDeleting(false);
    }
  }, [carInsurance.CarInsuranceId, deleteDialog, onRefresh, user]);

  return (
    <>
      <TableRow
        hover
        key={carInsurance.CarInsuranceId}
        selected={isSelected}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => {
              if (event.target.checked) {
                onSelectOne?.(carInsurance.CarInsuranceId);
              } else {
                onDeselectOne?.(carInsurance.CarInsuranceId);
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
            {carInsurance.Car?.CarNumber || '-'}
          </Stack>
        </TableCell>
        <TableCell>{carInsurance.Car?.Model || '-'}</TableCell>
        <TableCell>{carInsurance.StartDate && timestampToDate(carInsurance.StartDate)}</TableCell>
        <TableCell>{carInsurance.EndDate && timestampToDate(carInsurance.EndDate)}</TableCell>
        <TableCell>{carInsurance.Note}</TableCell>
        <TableCell>
          <Chip
            label={carInsurance.IsActive ? 'Active' : 'Inactive'}
            color={carInsurance.IsActive ? 'success' : 'default'}
            size="small"
          />
        </TableCell>
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
      <CarInsuranceListTableMenu
        anchorEl={popover.anchorRef.current}
        editLink={editLink}
        onClose={popover.handleClose}
        onDelete={handleOpenDeleteDialog}
        open={popover.open}
      />
      <CarInsuranceDeleteDialog
        carInsurance={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />
    </>
  );
};
