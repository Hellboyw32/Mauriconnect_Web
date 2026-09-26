import type { Servicing } from '@libs/types';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Edit02Icon from '@untitled-ui/icons-react/build/esm/Edit02';
import type { ChangeEvent, FC, MouseEvent } from 'react';
import { RouterLink } from 'src/components/router-link';
import { Scrollbar } from 'src/components/scrollbar';
import { paths } from 'src/paths';
import { timestampToDate } from 'src/utils/date-locale';
import { replaceIdPath } from 'src/utils/replace-id-path';

interface CarServicingListTableProps {
  count?: number;
  items?: Servicing[];
  onPageChange?: (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  page?: number;
  rowsPerPage?: number;
  isLoading?: boolean;
}

export const CarServicingListTable: FC<CarServicingListTableProps> = (props) => {
  const {
    count = 0,
    items = [],
    onPageChange = () => {},
    onRowsPerPageChange,
    page = 0,
    rowsPerPage = 0,
    isLoading = false
  } = props;

  return (
    <Box sx={{ position: 'relative' }}>
      <Scrollbar>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>Car</TableCell>
              <TableCell>Servicing Date</TableCell>
              <TableCell>Mileage</TableCell>
              <TableCell>Servicing Frequency</TableCell>
              <TableCell>Next Servicing Mileage</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                >
                  No servicing records found
                </TableCell>
              </TableRow>
            ) : (
              items.map((record) => (
                <TableRow
                  hover
                  key={record.ServicingId}
                >
                  <TableCell>
                    {record.Car?.CarNumber || '-'}
                    {record.Car?.Model ? ` - ${record.Car.Model}` : ''}
                  </TableCell>
                  <TableCell>
                    {record.DateServiced ? timestampToDate(record.DateServiced) : '-'}
                  </TableCell>
                  <TableCell>
                    {record.MileageServiced != null
                      ? `${record.MileageServiced.toLocaleString()} km`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.ServicingFrequency != null
                      ? `${record.ServicingFrequency.toLocaleString()} km`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.NextServicingMileage != null
                      ? `${record.NextServicingMileage.toLocaleString()} km`
                      : '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {record.Note || '-'}
                  </TableCell>
                  <TableCell>{record.CreatedBy || '-'}</TableCell>
                  <TableCell>
                    {record.CreatedOn ? timestampToDate(record.CreatedOn) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.IsCompleted ? 'Completed' : 'Pending'}
                      color={record.IsCompleted ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      component={RouterLink}
                      href={replaceIdPath(paths.carServicing.edit, ':servicingId', record.ServicingId)}
                      title="Edit"
                    >
                      <SvgIcon fontSize="small">
                        <Edit02Icon />
                      </SvgIcon>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
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
