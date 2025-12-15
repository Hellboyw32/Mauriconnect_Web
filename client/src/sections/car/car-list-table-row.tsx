import type { Car } from '@libs/types';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import DotsVerticalIcon from '@untitled-ui/icons-react/build/esm/DotsVertical';
import { useCallback, type ChangeEvent, type FC } from 'react';
import { useDialog } from 'src/hooks/use-dialog';
import { usePopover } from 'src/hooks/use-popover';
import { paths } from 'src/paths';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { CarDeleteDialog } from './car-delete-dialog';
import { CarListTableMenu } from './car-list-table-menu';

interface CarListTableRowProps {
  car: Car;
  isSelected?: boolean;
  onSelectOne?: (carId: number) => void;
  onDeselectOne?: (carId: number) => void;
}

export const CarListTableRow: FC<CarListTableRowProps> = (props) => {
  const { car, isSelected, onSelectOne, onDeselectOne } = props;
  const popover = usePopover<HTMLButtonElement>();
  const deleteDialog = useDialog<Car>();

  const carEditLink = replaceIdPath(paths.cars.edit, ':carId', car.CarId);

  const handleOpenDeleteDialog = useCallback((): void => {
    popover.handleClose();
    deleteDialog.handleOpen();
  }, [deleteDialog, popover]);

  const handleDelete = useCallback((): void => {
    // TODO: Delete car
    console.log(`Deleting car ${car.CarNumber}`);
  }, [car.CarNumber]);

  return (
    <>
      <TableRow
        hover
        key={car.CarId}
        selected={isSelected}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => {
              if (event.target.checked) {
                onSelectOne?.(car.CarId);
              } else {
                onDeselectOne?.(car.CarId);
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
            {car.CarNumber}
          </Stack>
        </TableCell>
        <TableCell>{car.Model}</TableCell>
        <TableCell>{car.CarCategory?.Category || '-'}</TableCell>
        <TableCell>{car.CurrentMileage?.toLocaleString() || 0} km</TableCell>
        <TableCell>{car.ServicingFrequency?.toLocaleString() || 0} km</TableCell>
        <TableCell>{car.LastServicedMileage?.toLocaleString() || 0} km</TableCell>
        <TableCell>
          <Chip
            label={car.IsActive ? 'Active' : 'Inactive'}
            color={car.IsActive ? 'success' : 'default'}
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
      <CarListTableMenu
        anchorEl={popover.anchorRef.current}
        editLink={carEditLink}
        onClose={popover.handleClose}
        onDelete={handleOpenDeleteDialog}
        open={popover.open}
      />
      <CarDeleteDialog
        car={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
      />
    </>
  );
};
