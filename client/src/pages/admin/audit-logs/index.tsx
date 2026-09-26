import type { AuditLogFilters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import RefreshCcw01Icon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCallback, useMemo, useState } from 'react';
import { Seo } from 'src/components/seo';
import { useAuditLogs } from 'src/hooks/admin-logs/use-audit-logs';
import { AuditLogListTable } from 'src/sections/admin/audit-logs/audit-log-list-table';
import { applyPagination } from 'src/utils/apply-pagination';

const Page = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    username: '',
    action: '',
    fromDate: undefined,
    toDate: undefined
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { auditLogs, isLoading, refetch } = useAuditLogs(filters);

  const paginated = useMemo(
    () => applyPagination(auditLogs, page, rowsPerPage),
    [auditLogs, page, rowsPerPage]
  );

  const handleRefresh = useCallback(() => {
    setPage(0);
    refetch(filters);
  }, [refetch, filters]);

  return (
    <>
      <Seo title="Administration: Audit Logs" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Typography variant="h4">Audit Logs</Typography>
              <Button
                onClick={handleRefresh}
                startIcon={
                  <SvgIcon>
                    <RefreshCcw01Icon />
                  </SvgIcon>
                }
                variant="contained"
              >
                Refresh
              </Button>
            </Stack>
            <Card>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                flexWrap="wrap"
                spacing={2}
                sx={{ p: 3 }}
              >
                <OutlinedInput
                  placeholder="Search by username"
                  value={filters.username}
                  onChange={(e) => setFilters((prev) => ({ ...prev, username: e.target.value }))}
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }}
                />
                <OutlinedInput
                  placeholder="Search by action (e.g. User Locked)"
                  value={filters.action}
                  onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }}
                />
                <DatePicker
                  label="From"
                  format="dd/MM/yyyy"
                  value={filters.fromDate ?? null}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, fromDate: value ?? undefined }))
                  }
                  slotProps={{ textField: { sx: { flex: 1, minWidth: { xs: '100%', md: 180 } } } }}
                />
                <DatePicker
                  label="To"
                  format="dd/MM/yyyy"
                  value={filters.toDate ?? null}
                  onChange={(value) => setFilters((prev) => ({ ...prev, toDate: value ?? undefined }))}
                  slotProps={{ textField: { sx: { flex: 1, minWidth: { xs: '100%', md: 180 } } } }}
                />
              </Stack>
              <Divider />
              <AuditLogListTable
                items={paginated}
                isLoading={isLoading}
                count={auditLogs.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
