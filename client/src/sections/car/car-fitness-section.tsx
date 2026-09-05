import type { FitnessCertificate } from '@libs/types';
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
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import { format } from 'date-fns';
import { useCallback, useMemo, useState, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { fitnessCertificatesApi } from 'src/api/fitness-certificate';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { useFitnessCertificates } from 'src/hooks/fitness-certificate/use-fitness-certificates';
import { paths } from 'src/paths';
import { CarFileUploader } from 'src/sections/car/car-file-uploader';
import { FitnessCertificateDeleteDialog } from 'src/sections/fitness-certificate/fitness-certificate-delete-dialog';
import { timestampToDate } from 'src/utils/date-locale';
import { getExpiryStatus } from 'src/utils/expiry-status';
import { replaceIdPath } from 'src/utils/replace-id-path';

interface CarFitnessSectionProps {
  carId: number;
  carNumber?: string | null;
}

export const CarFitnessSection: FC<CarFitnessSectionProps> = (props) => {
  const { carId, carNumber } = props;
  const [open, setOpen] = useState(true);
  const { user } = useAuth();
  const deleteDialog = useDialog<FitnessCertificate>();
  const uploadDialog = useDialog<FitnessCertificate>();
  const [isDeleting, setIsDeleting] = useState(false);

  const filters = carNumber ? { carNumber } : undefined;
  const { fitnessCertificates, isLoading, refetch } = useFitnessCertificates(filters);

  const items = useMemo(() => {
    return fitnessCertificates
      .filter((fitness) => fitness.CarId === carId)
      .sort((a, b) => {
        const aTime = a.EndDate ? new Date(a.EndDate).getTime() : 0;
        const bTime = b.EndDate ? new Date(b.EndDate).getTime() : 0;
        return bTime - aTime;
      });
  }, [fitnessCertificates, carId]);

  const latestFitnessId = items[0]?.FitnessId;

  const returnTo = encodeURIComponent(replaceIdPath(paths.cars.edit, ':carId', carId));
  const addHref = `${paths.fitnessCertificate.create}?carId=${carId}&returnTo=${returnTo}`;

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteDialog.data) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fitnessCertificatesApi.deleteFitnessCertificate({
        fitnessId: deleteDialog.data.FitnessId,
        createdBy: user?.email || 'system'
      });

      toast.success(response.message || 'Fitness certificate record deleted successfully');
      deleteDialog.handleClose();
      refetch(filters);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete fitness certificate record');
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
          <Typography variant="h6">Car Fitness Records</Typography>
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
            Add Fitness Record
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
              No Fitness records yet
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
                <TableCell>Certificate Number</TableCell>
                <TableCell>Issued By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((fitness) => {
                const status = getExpiryStatus(fitness.EndDate);
                const editHref = `${replaceIdPath(
                  paths.fitnessCertificate.edit,
                  ':fitnessId',
                  fitness.FitnessId
                )}?returnTo=${returnTo}`;

                return (
                  <TableRow
                    hover
                    key={fitness.FitnessId}
                  >
                    <TableCell>
                      {fitness.StartDate ? timestampToDate(fitness.StartDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={1}
                      >
                        <span>{fitness.EndDate ? timestampToDate(fitness.EndDate) : '-'}</span>
                        {fitness.FitnessId === latestFitnessId && (
                          <Chip
                            label="Latest"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{fitness.CertificateNumber || '-'}</TableCell>
                    <TableCell>{fitness.IssuedBy || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{fitness.Note || '-'}</TableCell>
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
                          disabled={!fitness.StartDate}
                          onClick={() => uploadDialog.handleOpen(fitness)}
                          size="small"
                          title={
                            fitness.StartDate
                              ? undefined
                              : 'This record has no Start Date, so a destination folder cannot be determined'
                          }
                        >
                          Upload
                        </Button>
                        {fitness.FitnessId !== latestFitnessId && (
                          <Button
                            color="error"
                            onClick={() => deleteDialog.handleOpen(fitness)}
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

      <FitnessCertificateDeleteDialog
        fitnessCertificate={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />

      {uploadDialog.data && (
        <CarFileUploader
          carId={carId}
          section="CarFitness"
          sectionLabel="Car Fitness"
          startDate={
            uploadDialog.data.StartDate
              ? format(new Date(uploadDialog.data.StartDate), 'yyyy-MM-dd')
              : ''
          }
          open={uploadDialog.open}
          onClose={uploadDialog.handleClose}
        />
      )}
    </Card>
  );
};
