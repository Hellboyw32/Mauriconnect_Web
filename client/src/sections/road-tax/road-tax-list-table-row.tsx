import type { RoadTax } from '@libs/types';
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
import { roadTaxesApi } from 'src/api/road-tax';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { usePopover } from 'src/hooks/use-popover';
import { paths } from 'src/paths';
import { timestampToDate } from 'src/utils/date-locale';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { RoadTaxDeleteDialog } from './road-tax-delete-dialog';
import { RoadTaxListTableMenu } from './road-tax-list-table-menu';

interface RoadTaxListTableRowProps {
  roadTax: RoadTax;
  isSelected?: boolean;
  onSelectOne?: (roadTaxId: number) => void;
  onDeselectOne?: (roadTaxId: number) => void;
  onRefresh?: () => void;
}

export const RoadTaxListTableRow: FC<RoadTaxListTableRowProps> = (props) => {
  const { roadTax, isSelected, onSelectOne, onDeselectOne, onRefresh } = props;
  const popover = usePopover<HTMLButtonElement>();
  const deleteDialog = useDialog<RoadTax>();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const editLink = replaceIdPath(paths.roadTax.edit, ':roadTaxId', roadTax.RoadTaxId);

  const handleOpenDeleteDialog = useCallback((): void => {
    popover.handleClose();
    deleteDialog.handleOpen(roadTax);
  }, [roadTax, deleteDialog, popover]);

  const handleDelete = useCallback(async (): Promise<void> => {
    try {
      setIsDeleting(true);
      const response = await roadTaxesApi.deleteRoadTax({
        roadTaxId: roadTax.RoadTaxId,
        createdBy: user?.username || 'system'
      });

      toast.success(response.message || 'Road tax record deleted successfully');
      deleteDialog.handleClose();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete road tax record');
    } finally {
      setIsDeleting(false);
    }
  }, [roadTax.RoadTaxId, deleteDialog, onRefresh, user]);

  return (
    <>
      <TableRow
        hover
        key={roadTax.RoadTaxId}
        selected={isSelected}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => {
              if (event.target.checked) {
                onSelectOne?.(roadTax.RoadTaxId);
              } else {
                onDeselectOne?.(roadTax.RoadTaxId);
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
            {roadTax.Car?.CarNumber || '-'}
          </Stack>
        </TableCell>
        <TableCell>{roadTax.Car?.Model || '-'}</TableCell>
        <TableCell>{roadTax.StartDate && timestampToDate(roadTax.StartDate)}</TableCell>
        <TableCell>{roadTax.EndDate && timestampToDate(roadTax.EndDate)}</TableCell>
        <TableCell>{roadTax.Note}</TableCell>
        <TableCell>
          <Chip
            label={roadTax.IsActive ? 'Active' : 'Inactive'}
            color={roadTax.IsActive ? 'success' : 'default'}
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
      <RoadTaxListTableMenu
        anchorEl={popover.anchorRef.current}
        editLink={editLink}
        onClose={popover.handleClose}
        onDelete={handleOpenDeleteDialog}
        open={popover.open}
      />
      <RoadTaxDeleteDialog
        roadTax={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />
    </>
  );
};
