import { hasPermission } from '@libs/permissions';
import type { Psvl } from '@libs/types';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useCars } from 'src/hooks/cars/use-cars';
import { usePsvls } from 'src/hooks/psvl/use-psvls';
import { useAuth } from 'src/hooks/use-auth';
import { paths } from 'src/paths';
import { getExpiryStatus } from 'src/utils/expiry-status';
import { toLocalDate } from 'src/utils/local-date';
import { replaceIdPath } from 'src/utils/replace-id-path';

const displayDate = (value: string) => format(toLocalDate(value), 'dd/MM/yyyy');

const getStatus = (psvl: Psvl) =>
  toLocalDate(psvl.StartDate).getTime() > Date.now()
    ? ({ label: 'Upcoming', color: 'info' } as const)
    : getExpiryStatus(psvl.EndDate);

const Page = () => {
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'Cars', 'Edit');
  const { psvls, isLoading } = usePsvls(undefined, { all: true });
  const { cars } = useCars();
  const [search, setSearch] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();

    return psvls.filter(
      (psvl) =>
        !term ||
        psvl.Car?.CarNumber?.toLowerCase().includes(term) ||
        psvl.Car?.Model?.toLowerCase().includes(term) ||
        psvl.Company?.toLowerCase().includes(term)
    );
  }, [psvls, search]);

  const returnTo = encodeURIComponent(paths.psvl.index);
  const carEditHref = (carId: number) => replaceIdPath(paths.cars.edit, ':carId', carId);

  return (
    <>
      <Seo title="PSVL: List" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Typography variant="h4">PSVL</Typography>
              {canEdit && (
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={2}
                >
                  <Autocomplete
                    size="small"
                    sx={{ width: 280 }}
                    options={cars}
                    getOptionLabel={(car) => `${car.Model} - ${car.CarNumber}`}
                    value={cars.find((car) => car.CarId === selectedCarId) ?? null}
                    onChange={(_, selected) => setSelectedCarId(selected?.CarId ?? '')}
                    isOptionEqualToValue={(option, value) => option.CarId === value.CarId}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Car"
                      />
                    )}
                  />
                  <Button
                    component={RouterLink}
                    disabled={!selectedCarId}
                    href={
                      selectedCarId
                        ? `${replaceIdPath(paths.cars.psvlCreate, ':carId', selectedCarId)}?returnTo=${returnTo}`
                        : '#'
                    }
                    startIcon={
                      <SvgIcon>
                        <PlusIcon />
                      </SvgIcon>
                    }
                    variant="contained"
                  >
                    Add PSVL
                  </Button>
                </Stack>
              )}
            </Stack>

            <Card>
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  label="Search by car number, model or company"
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                  value={search}
                />
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : items.length === 0 ? (
                <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">No PSVL records found</Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Car</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((psvl) => {
                      const status = getStatus(psvl);

                      return (
                        <TableRow
                          hover
                          key={psvl.PsvlId}
                        >
                          <TableCell>
                            {psvl.Car?.Model} ({psvl.Car?.CarNumber})
                          </TableCell>
                          <TableCell>{displayDate(psvl.StartDate)}</TableCell>
                          <TableCell>{displayDate(psvl.EndDate)}</TableCell>
                          <TableCell>{psvl.Company || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              color={status.color}
                              label={status.label}
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
                              {canEdit && (
                                <Button
                                  component={RouterLink}
                                  href={`${replaceIdPath(
                                    replaceIdPath(paths.cars.psvlEdit, ':carId', psvl.CarId),
                                    ':psvlId',
                                    psvl.PsvlId
                                  )}?returnTo=${returnTo}`}
                                  size="small"
                                >
                                  Edit
                                </Button>
                              )}
                              <Button
                                component={RouterLink}
                                href={carEditHref(psvl.CarId)}
                                size="small"
                              >
                                Open Car (documents)
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
