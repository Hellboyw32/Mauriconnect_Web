import type { FitnessCertificate } from '@libs/types';
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
import { fitnessCertificatesApi } from 'src/api/fitness-certificate';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { usePopover } from 'src/hooks/use-popover';
import { paths } from 'src/paths';
import { timestampToDate } from 'src/utils/date-locale';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { FitnessCertificateDeleteDialog } from './fitness-certificate-delete-dialog';
import { FitnessCertificateListTableMenu } from './fitness-certificate-list-table-menu';

interface FitnessCertificateListTableRowProps {
  fitnessCertificate: FitnessCertificate;
  isSelected?: boolean;
  onSelectOne?: (fitnessId: number) => void;
  onDeselectOne?: (fitnessId: number) => void;
  onRefresh?: () => void;
}

export const FitnessCertificateListTableRow: FC<FitnessCertificateListTableRowProps> = (props) => {
  const { fitnessCertificate, isSelected, onSelectOne, onDeselectOne, onRefresh } = props;
  const popover = usePopover<HTMLButtonElement>();
  const deleteDialog = useDialog<FitnessCertificate>();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const editLink = replaceIdPath(
    paths.fitnessCertificate.edit,
    ':fitnessId',
    fitnessCertificate.FitnessId
  );

  const handleOpenDeleteDialog = useCallback((): void => {
    popover.handleClose();
    deleteDialog.handleOpen(fitnessCertificate);
  }, [fitnessCertificate, deleteDialog, popover]);

  const handleDelete = useCallback(async (): Promise<void> => {
    try {
      setIsDeleting(true);
      const response = await fitnessCertificatesApi.deleteFitnessCertificate({
        fitnessId: fitnessCertificate.FitnessId,
        createdBy: user?.username || 'system'
      });

      toast.success(response.message || 'Fitness certificate record deleted successfully');
      deleteDialog.handleClose();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete fitness certificate record');
    } finally {
      setIsDeleting(false);
    }
  }, [fitnessCertificate.FitnessId, deleteDialog, onRefresh, user]);

  return (
    <>
      <TableRow
        hover
        key={fitnessCertificate.FitnessId}
        selected={isSelected}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => {
              if (event.target.checked) {
                onSelectOne?.(fitnessCertificate.FitnessId);
              } else {
                onDeselectOne?.(fitnessCertificate.FitnessId);
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
            {fitnessCertificate.Car?.CarNumber || '-'}
          </Stack>
        </TableCell>
        <TableCell>{fitnessCertificate.Car?.Model || '-'}</TableCell>
        <TableCell>
          {fitnessCertificate.StartDate && timestampToDate(fitnessCertificate.StartDate)}
        </TableCell>
        <TableCell>
          {fitnessCertificate.EndDate && timestampToDate(fitnessCertificate.EndDate)}
        </TableCell>
        <TableCell>{fitnessCertificate.Note}</TableCell>
        <TableCell>
          <Chip
            label={fitnessCertificate.IsActive ? 'Active' : 'Inactive'}
            color={fitnessCertificate.IsActive ? 'success' : 'default'}
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
      <FitnessCertificateListTableMenu
        anchorEl={popover.anchorRef.current}
        editLink={editLink}
        onClose={popover.handleClose}
        onDelete={handleOpenDeleteDialog}
        open={popover.open}
      />
      <FitnessCertificateDeleteDialog
        fitnessCertificate={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />
    </>
  );
};
