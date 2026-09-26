import type { RoadTax } from '@libs/types';
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
import { roadTaxesApi } from 'src/api/road-tax';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { useRoadTaxes } from 'src/hooks/road-tax/use-road-taxes';
import { paths } from 'src/paths';
import { CarFileUploader } from 'src/sections/car/car-file-uploader';
import { RoadTaxDeleteDialog } from 'src/sections/road-tax/road-tax-delete-dialog';
import { timestampToDate } from 'src/utils/date-locale';
import { getExpiryStatus } from 'src/utils/expiry-status';
import { replaceIdPath } from 'src/utils/replace-id-path';

interface CarRoadTaxSectionProps {
  carId: number;
  carNumber?: string | null;
}

export const CarRoadTaxSection: FC<CarRoadTaxSectionProps> = (props) => {
  const { carId, carNumber } = props;
  const [open, setOpen] = useState(true);
  const { user } = useAuth();
  const deleteDialog = useDialog<RoadTax>();
  const uploadDialog = useDialog<RoadTax>();
  const [isDeleting, setIsDeleting] = useState(false);

  const filters = carNumber ? { carNumber } : undefined;
  const { roadTaxes, isLoading, refetch } = useRoadTaxes(filters);

  const items = useMemo(() => {
    return roadTaxes
      .filter((roadTax) => roadTax.CarId === carId)
      .sort((a, b) => {
        const aTime = a.EndDate ? new Date(a.EndDate).getTime() : 0;
        const bTime = b.EndDate ? new Date(b.EndDate).getTime() : 0;
        return bTime - aTime;
      });
  }, [roadTaxes, carId]);

  const latestRoadTaxId = items[0]?.RoadTaxId;

  const returnTo = encodeURIComponent(replaceIdPath(paths.cars.edit, ':carId', carId));
  const addHref = `${paths.roadTax.create}?carId=${carId}&returnTo=${returnTo}`;

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteDialog.data) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await roadTaxesApi.deleteRoadTax({
        roadTaxId: deleteDialog.data.RoadTaxId,
        createdBy: user?.email || 'system'
      });

      toast.success(response.message || 'Road tax record deleted successfully');
      deleteDialog.handleClose();
      refetch(filters);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete road tax record');
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
          <Typography variant="h6">Road Tax Records</Typography>
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
            Add Road Tax
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
              No Road Tax records yet
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
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((roadTax) => {
                const status = getExpiryStatus(roadTax.EndDate);
                const editHref = `${replaceIdPath(
                  paths.roadTax.edit,
                  ':roadTaxId',
                  roadTax.RoadTaxId
                )}?returnTo=${returnTo}`;

                return (
                  <TableRow
                    hover
                    key={roadTax.RoadTaxId}
                  >
                    <TableCell>
                      {roadTax.StartDate ? timestampToDate(roadTax.StartDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={1}
                      >
                        <span>{roadTax.EndDate ? timestampToDate(roadTax.EndDate) : '-'}</span>
                        {roadTax.RoadTaxId === latestRoadTaxId && (
                          <Chip
                            label="Latest"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{roadTax.Note || '-'}</TableCell>
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
                          disabled={!roadTax.StartDate}
                          onClick={() => uploadDialog.handleOpen(roadTax)}
                          size="small"
                          title={
                            roadTax.StartDate
                              ? undefined
                              : 'This record has no Start Date, so a destination folder cannot be determined'
                          }
                        >
                          Upload
                        </Button>
                        {roadTax.RoadTaxId !== latestRoadTaxId && (
                          <Button
                            color="error"
                            onClick={() => deleteDialog.handleOpen(roadTax)}
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

      <RoadTaxDeleteDialog
        roadTax={deleteDialog.data}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        open={deleteDialog.open}
        isDeleting={isDeleting}
      />

      {uploadDialog.data && (
        <CarFileUploader
          carId={carId}
          section="RoadTax"
          sectionLabel="Road Tax"
          startDate={
            uploadDialog.data.StartDate ? format(new Date(uploadDialog.data.StartDate), 'yyyy-MM-dd') : ''
          }
          open={uploadDialog.open}
          onClose={uploadDialog.handleClose}
        />
      )}
    </Card>
  );
};
