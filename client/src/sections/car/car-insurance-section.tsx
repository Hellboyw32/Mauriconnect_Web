import type { CarInsurance } from '@libs/types';
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
import numeral from 'numeral';
import { useCallback, useMemo, useState, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { carInsurancesApi } from 'src/api/car-insurance';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { useCarInsurances } from 'src/hooks/car-insurance/use-car-insurances';
import { paths } from 'src/paths';
import { CarDocumentCountChip } from 'src/sections/car/car-document-count-chip';
import { CarDocumentViewerDialog } from 'src/sections/car/car-document-viewer-dialog';
import { CarFileUploader } from 'src/sections/car/car-file-uploader';
import { CarInsuranceDeleteDialog } from 'src/sections/car-insurance/car-insurance-delete-dialog';
import { timestampToDate } from 'src/utils/date-locale';
import { getExpiryStatus } from 'src/utils/expiry-status';
import { replaceIdPath } from 'src/utils/replace-id-path';

interface CarInsuranceSectionProps {
  carId: number;
  carNumber?: string | null;
}

export const CarInsuranceSection: FC<CarInsuranceSectionProps> = (props) => {
  const { carId, carNumber } = props;
  const [open, setOpen] = useState(true);
  const { user } = useAuth();
  const deleteDialog = useDialog<CarInsurance>();
  const uploadDialog = useDialog<CarInsurance>();
  const viewDialog = useDialog<CarInsurance>();
  const [isDeleting, setIsDeleting] = useState(false);
  // Bumped whenever the upload/view dialog for a row closes, so that row's
  // document count chip re-fetches (files may have been added or removed).
  const [documentCountRefreshTrigger, setDocumentCountRefreshTrigger] = useState(0);
  const refreshDocumentCounts = useCallback(() => {
    setDocumentCountRefreshTrigger((prev) => prev + 1);
  }, []);

  const filters = carNumber ? { carNumber } : undefined;
  const { carInsurances, isLoading, refetch } = useCarInsurances(filters);

  const items = useMemo(() => {
    return carInsurances
      .filter((insurance) => insurance.CarId === carId)
      .sort((a, b) => {
        const aTime = a.EndDate ? new Date(a.EndDate).getTime() : 0;
        const bTime = b.EndDate ? new Date(b.EndDate).getTime() : 0;
        return bTime - aTime;
      });
  }, [carInsurances, carId]);

  const latestCarInsuranceId = items[0]?.CarInsuranceId;

  const returnTo = encodeURIComponent(replaceIdPath(paths.cars.edit, ':carId', carId));
  const addHref = `${paths.carInsurance.create}?carId=${carId}&returnTo=${returnTo}`;

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteDialog.data) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await carInsurancesApi.deleteCarInsurance({
        carInsuranceId: deleteDialog.data.CarInsuranceId,
        createdBy: user?.email || 'system'
      });

      toast.success(response.message || 'Car insurance record deleted successfully');
      deleteDialog.handleClose();
      refetch(filters);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete car insurance record');
    } finally {
      setIsDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDialog.data, refetch, carNumber, user]);

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
          <Typography variant="h6">Car Insurance Records</Typography>
          <Chip
            label={`${items.length} record${items.length === 1 ? '' : 's'}`}
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
            Add Insurance Record
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
        ) : items.length === 0 ? (
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
              No Insurance records yet
            </Typography>
            <Button
              component={RouterLink}
              href={addHref}
              variant="contained"
            >
              Add First Record
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Policy Number</TableCell>
                <TableCell>Insurer</TableCell>
                <TableCell>Coverage Type</TableCell>
                <TableCell>Premium (MUR)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((insurance) => {
                const status = getExpiryStatus(insurance.EndDate);
                const editHref = `${replaceIdPath(
                  paths.carInsurance.edit,
                  ':carInsuranceId',
                  insurance.CarInsuranceId
                )}?returnTo=${returnTo}`;

                return (
                  <TableRow
                    hover
                    key={insurance.CarInsuranceId}
                  >
                    <TableCell>
                      {insurance.StartDate ? timestampToDate(insurance.StartDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={1}
                      >
                        <span>{insurance.EndDate ? timestampToDate(insurance.EndDate) : '-'}</span>
                        {insurance.CarInsuranceId === latestCarInsuranceId && (
                          <Chip
                            label="Latest"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{insurance.PolicyNumber || '-'}</TableCell>
                    <TableCell>{insurance.Insurer || '-'}</TableCell>
                    <TableCell>{insurance.CoverageType || '-'}</TableCell>
                    <TableCell>
                      {insurance.Premium != null
                        ? `MUR ${numeral(insurance.Premium).format('0,0.00')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{insurance.Note || '-'}</TableCell>
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
                          disabled={!insurance.StartDate || !carNumber}
                          onClick={() => uploadDialog.handleOpen(insurance)}
                          size="small"
                          title={
                            !insurance.StartDate
                              ? 'This record has no Start Date, so a destination folder cannot be determined'
                              : !carNumber
                                ? 'This car has no Car Number, so a destination folder cannot be determined'
                                : undefined
                          }
                        >
                          Upload
                        </Button>
                        <Button
                          disabled={!insurance.StartDate || !carNumber}
                          onClick={() => viewDialog.handleOpen(insurance)}
                          size="small"
                          startIcon={
                            <SvgIcon fontSize="small">
                              <EyeIcon />
                            </SvgIcon>
                          }
                          title={
                            !insurance.StartDate
                              ? 'This record has no Start Date, so a destination folder cannot be determined'
                              : !carNumber
                                ? 'This car has no Car Number, so a destination folder cannot be determined'
                                : undefined
                          }
                        >
                          View Documents
                        </Button>
                        {carNumber && (
                          <CarDocumentCountChip
                            carNumber={carNumber}
                            section="Insurance"
                            startDate={
                              insurance.StartDate ? format(new Date(insurance.StartDate), 'yyyy-MM-dd') : ''
                            }
                            refreshTrigger={documentCountRefreshTrigger}
                          />
                        )}
                        {insurance.CarInsuranceId !== latestCarInsuranceId && (
                          <Button
                            color="error"
                            onClick={() => deleteDialog.handleOpen(insurance)}
                            size="small"
                          >
                            Delete
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Collapse>

      <CarInsuranceDeleteDialog
        carInsurance={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />

      {uploadDialog.data && carNumber && (
        <CarFileUploader
          carNumber={carNumber}
          section="Insurance"
          sectionLabel="Car Insurance"
          startDate={
            uploadDialog.data.StartDate
              ? format(new Date(uploadDialog.data.StartDate), 'yyyy-MM-dd')
              : ''
          }
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
          section="Insurance"
          sectionLabel="Car Insurance"
          startDate={
            viewDialog.data.StartDate
              ? format(new Date(viewDialog.data.StartDate), 'yyyy-MM-dd')
              : ''
          }
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
