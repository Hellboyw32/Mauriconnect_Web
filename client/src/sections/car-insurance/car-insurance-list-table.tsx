import type { CarInsurance } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import type { ChangeEvent, FC, MouseEvent } from 'react';
import { Scrollbar } from 'src/components/scrollbar';
import { CarInsuranceListTableRow } from './car-insurance-list-table-row';

interface CarInsuranceListTableProps {
  count?: number;
  items?: CarInsurance[];
  onDeselectAll?: () => void;
  onDeselectOne?: (carInsuranceId: number) => void;
  onPageChange?: (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectAll?: () => void;
  onSelectOne?: (carInsuranceId: number) => void;
  onSortChange?: (sort: { sortBy: string; sortDir: 'asc' | 'desc' }) => void;
  onRefresh?: () => void;
  page?: number;
  rowsPerPage?: number;
  selected?: number[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  isLoading?: boolean;
}

export const CarInsuranceListTable: FC<CarInsuranceListTableProps> = (props) => {
  const {
    count = 0,
    items = [],
    onDeselectAll,
    onDeselectOne,
    onPageChange = () => {},
    onRowsPerPageChange,
    onSelectAll,
    onSelectOne,
    onRefresh,
    page = 0,
    rowsPerPage = 0,
    selected = [],
    isLoading = false
  } = props;

  const selectedSome = selected.length > 0 && selected.length < items.length;
  const selectedAll = items.length > 0 && selected.length === items.length;
  const enableBulkActions = selected.length > 0;

  return (
    <Box sx={{ position: 'relative' }}>
      {enableBulkActions && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'neutral.800' : 'neutral.50',
            display: enableBulkActions ? 'flex' : 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            px: 2,
            py: 0.5,
            zIndex: 10
          }}
        >
          <Checkbox
            checked={selectedAll}
            indeterminate={selectedSome}
            onChange={(event) => {
              if (event.target.checked) {
                onSelectAll?.();
              } else {
                onDeselectAll?.();
              }
            }}
          />
          <Button
            color="inherit"
            size="small"
          >
            Delete
          </Button>
          <Button
            color="inherit"
            size="small"
          >
            Edit
          </Button>
        </Stack>
      )}
      <Scrollbar>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      onSelectAll?.();
                    } else {
                      onDeselectAll?.();
                    }
                  }}
                />
              </TableCell>
              <TableCell>Car Number</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                >
                  No car insurance records found
                </TableCell>
              </TableRow>
            ) : (
              items.map((carInsurance) => {
                const isSelected = selected.includes(carInsurance.CarInsuranceId);
                return (
                  <CarInsuranceListTableRow
                    isSelected={isSelected}
                    carInsurance={carInsurance}
                    key={carInsurance.CarInsuranceId}
                    onSelectOne={onSelectOne}
                    onDeselectOne={onDeselectOne}
                    onRefresh={onRefresh}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </Scrollbar>
      <TablePagination
        component="div"
        count={count}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, { value: -1, label: 'All' }]}
      />
    </Box>
  );
};
