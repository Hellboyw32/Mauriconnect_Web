import type { Psvl } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ChevronDownIcon from '@untitled-ui/icons-react/build/esm/ChevronDown';
import ChevronRightIcon from '@untitled-ui/icons-react/build/esm/ChevronRight';
import EyeIcon from '@untitled-ui/icons-react/build/esm/Eye';
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import { format } from 'date-fns';
import { useCallback, useState, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { psvlApi } from 'src/api/psvl';
import { RouterLink } from 'src/components/router-link';
import { usePsvls } from 'src/hooks/psvl/use-psvls';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { paths } from 'src/paths';
import { CarDocumentCountChip } from 'src/sections/car/car-document-count-chip';
import { CarDocumentViewerDialog } from 'src/sections/car/car-document-viewer-dialog';
import { CarFileUploader } from 'src/sections/car/car-file-uploader';
import { PsvlDeleteDialog } from 'src/sections/psvl/psvl-delete-dialog';
import { getExpiryStatus, type ExpiryStatus } from 'src/utils/expiry-status';
import { toLocalDate } from 'src/utils/local-date';
import { replaceIdPath } from 'src/utils/replace-id-path';

interface CarPsvlSectionProps {
  carId: number;
  carNumber?: string | null;
}

const displayDate = (value: string) => format(toLocalDate(value), 'dd/MM/yyyy');

// Documents live in /Dropbox/Cars/[CarNumber]/PSVL/[StartDate]/ (see ftp.ts).
const folderDate = (value: string) => format(toLocalDate(value), 'yyyy-MM-dd');

const getPsvlStatus = (psvl: Psvl): ExpiryStatus | { label: string; color: 'info' } => {
  if (toLocalDate(psvl.StartDate).getTime() > Date.now()) {
    return { label: 'Upcoming', color: 'info' };
  }

  return getExpiryStatus(psvl.EndDate);
};

export const CarPsvlSection: FC<CarPsvlSectionProps> = (props) => {
  const { carId, carNumber } = props;
  const [open, setOpen] = useState(true);
  const { user } = useAuth();
  const deleteDialog = useDialog<Psvl>();
  const uploadDialog = useDialog<Psvl>();
  const viewDialog = useDialog<Psvl>();
  const [isDeleting, setIsDeleting] = useState(false);
  // Bumped whenever the upload/view dialog closes so the document count chips re-fetch.
  const [documentCountRefreshTrigger, setDocumentCountRefreshTrigger] = useState(0);
  const refreshDocumentCounts = useCallback(() => {
    setDocumentCountRefreshTrigger((prev) => prev + 1);
  }, []);

  const { psvls, isLoading, refetch } = usePsvls(carId);

  const addHref = replaceIdPath(paths.cars.psvlCreate, ':carId', carId);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteDialog.data) {
      return;
    }

    try {
      setIsDeleting(true);
      await psvlApi.deletePsvl(deleteDialog.data.PsvlId, user?.username || 'system');
      toast.success('PSVL deleted successfully');
      deleteDialog.handleClose();
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete PSVL');
    } finally {
      setIsDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDialog.data, refetch, user]);

  return (
    <Card>
      <Box
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          alignItems: 'center',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1.5}
        >
          <Typography variant="h6">PSVL</Typography>
          <Chip
            label={`${psvls.length} record${psvls.length === 1 ? '' : 's'}`}
            size="small"
          />
        </Stack>
        <SvgIcon sx={{ color: 'text.secondary' }}>
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </SvgIcon>
      </Box>

      <Collapse in={open}>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            px: 3,
            py: 1.5
          }}
        >
          <Button
            component={RouterLink}
            href={addHref}
            size="small"
            startIcon={
              <SvgIcon fontSize="small">
                <PlusIcon />
              </SvgIcon>
            }
            variant="contained"
          >
            Add PSVL
          </Button>
        </Stack>

        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 4
            }}
          >
            <CircularProgress />
          </Box>
        ) : psvls.length === 0 ? (
          <Box
            sx={{
              px: 3,
              py: 5,
              textAlign: 'center'
            }}
          >
            <Typography
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              No PSVL records yet
            </Typography>
            <Button
              component={RouterLink}
              href={addHref}
              variant="contained"
            >
              Add First PSVL
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {psvls.map((psvl) => {
                const status = getPsvlStatus(psvl);
                const editHref = replaceIdPath(
                  replaceIdPath(paths.cars.psvlEdit, ':carId', carId),
                  ':psvlId',
                  psvl.PsvlId
                );

                return (
                  <TableRow
                    hover
                    key={psvl.PsvlId}
                  >
                    <TableCell>{displayDate(psvl.StartDate)}</TableCell>
                    <TableCell>{displayDate(psvl.EndDate)}</TableCell>
                    <TableCell>{psvl.Company || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{psvl.Note || '-'}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        spacing={1}
                      >
                        <Button
                          component={RouterLink}
                          href={editHref}
                          size="small"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={!carNumber}
                          onClick={() => uploadDialog.handleOpen(psvl)}
                          size="small"
                          title={
                            !carNumber
                              ? 'This car has no Car Number, so a destination folder cannot be determined'
                              : undefined
                          }
                        >
                          Upload
                        </Button>
                        <Button
                          disabled={!carNumber}
                          onClick={() => viewDialog.handleOpen(psvl)}
                          size="small"
                          startIcon={
                            <SvgIcon fontSize="small">
                              <EyeIcon />
                            </SvgIcon>
                          }
                          title={
                            !carNumber
                              ? 'This car has no Car Number, so a destination folder cannot be determined'
                              : undefined
                          }
                        >
                          View Documents
                        </Button>
                        {carNumber && (
                          <CarDocumentCountChip
                            carNumber={carNumber}
                            section="PSVL"
                            startDate={folderDate(psvl.StartDate)}
                            refreshTrigger={documentCountRefreshTrigger}
                          />
                        )}
                        <Button
                          color="error"
                          onClick={() => deleteDialog.handleOpen(psvl)}
                          size="small"
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Collapse>

      <PsvlDeleteDialog
        psvl={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />

      {uploadDialog.data && carNumber && (
        <CarFileUploader
          carNumber={carNumber}
          section="PSVL"
          sectionLabel="PSVL"
          startDate={folderDate(uploadDialog.data.StartDate)}
          open={uploadDialog.open}
          onClose={() => {
            uploadDialog.handleClose();
            refreshDocumentCounts();
          }}
        />
      )}

      {viewDialog.data && carNumber && (
        <CarDocumentViewerDialog
          carNumber={carNumber}
          section="PSVL"
          sectionLabel="PSVL"
          startDate={folderDate(viewDialog.data.StartDate)}
          open={viewDialog.open}
          onClose={() => {
            viewDialog.handleClose();
            refreshDocumentCounts();
          }}
        />
      )}
    </Card>
  );
};
