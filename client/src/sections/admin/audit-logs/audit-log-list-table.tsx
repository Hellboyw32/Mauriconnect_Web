import type { AuditLogs } from '@libs/types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { format } from 'date-fns';
import type { ChangeEvent, FC, MouseEvent } from 'react';
import { Scrollbar } from 'src/components/scrollbar';

interface AuditLogListTableProps {
  items?: AuditLogs;
  isLoading?: boolean;
  count?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm:ss');
  } catch {
    return '—';
  }
};

export const AuditLogListTable: FC<AuditLogListTableProps> = (props) => {
  const {
    items = [],
    isLoading = false,
    count = 0,
    page = 0,
    rowsPerPage = 25,
    onPageChange = () => {},
    onRowsPerPageChange
  } = props;

  return (
    <Box>
      <Scrollbar>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  No audit activity found
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log.Id}>
                  <TableCell>{log.Username || '—'}</TableCell>
                  <TableCell>{log.Action}</TableCell>
                  <TableCell>
                    {log.EntityType}
                    {log.EntityId ? ` #${log.EntityId}` : ''}
                  </TableCell>
                  <TableCell>{log.Description || '—'}</TableCell>
                  <TableCell>{formatDate(log.Timestamp)}</TableCell>
                  <TableCell>{log.IPAddress || '—'}</TableCell>
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
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
};
