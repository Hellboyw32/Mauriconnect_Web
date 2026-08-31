import type { UserLoginLogFilters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RefreshCcw01Icon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCallback, useMemo, useState } from 'react';
import { Seo } from 'src/components/seo';
import { useLoginLogs } from 'src/hooks/admin-logs/use-login-logs';
import { LoginLogListTable } from 'src/sections/admin/login-logs/login-log-list-table';
import { applyPagination } from 'src/utils/apply-pagination';

const Page = () => {
  const [filters, setFilters] = useState<UserLoginLogFilters>({
    username: '',
    fromDate: undefined,
    toDate: undefined,
    loginSuccessful: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { loginLogs, isLoading, refetch } = useLoginLogs(filters);

  const paginated = useMemo(
    () => applyPagination(loginLogs, page, rowsPerPage),
    [loginLogs, page, rowsPerPage]
  );

  const handleRefresh = useCallback(() => {
    setPage(0);
    refetch(filters);
  }, [refetch, filters]);

  return (
    <>
      <Seo title="Administration: User Activity Logs" />
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
              <Typography variant="h4">User Activity Logs</Typography>
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
                <TextField
                  select
                  label="Status"
                  value={filters.loginSuccessful === '' ? '' : String(filters.loginSuccessful)}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      loginSuccessful: e.target.value === '' ? '' : e.target.value === 'true'
                    }))
                  }
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Successful</MenuItem>
                  <MenuItem value="false">Failed</MenuItem>
                </TextField>
              </Stack>
              <Divider />
              <LoginLogListTable
                items={paginated}
                isLoading={isLoading}
                count={loginLogs.length}
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
