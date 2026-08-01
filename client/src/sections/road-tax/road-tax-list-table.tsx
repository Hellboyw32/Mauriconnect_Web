import type { RoadTax } from '@libs/types';
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
import { RoadTaxListTableRow } from './road-tax-list-table-row';

interface RoadTaxListTableProps {
  count?: number;
  items?: RoadTax[];
  onDeselectAll?: () => void;
  onDeselectOne?: (roadTaxId: number) => void;
  onPageChange?: (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectAll?: () => void;
  onSelectOne?: (roadTaxId: number) => void;
  onSortChange?: (sort: { sortBy: string; sortDir: 'asc' | 'desc' }) => void;
  onRefresh?: () => void;
  page?: number;
  rowsPerPage?: number;
  selected?: number[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  isLoading?: boolean;
}

export const RoadTaxListTable: FC<RoadTaxListTableProps> = (props) => {
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
                  No road tax records found
                </TableCell>
              </TableRow>
            ) : (
              items.map((roadTax) => {
                const isSelected = selected.includes(roadTax.RoadTaxId);
                return (
                  <RoadTaxListTableRow
                    isSelected={isSelected}
                    roadTax={roadTax}
                    key={roadTax.RoadTaxId}
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
