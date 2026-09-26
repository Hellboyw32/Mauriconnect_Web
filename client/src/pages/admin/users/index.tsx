import type { UserFilters } from '@libs/types';
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
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import RefreshCcw01Icon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import { useCallback, useState } from 'react';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useAuth } from 'src/hooks/use-auth';
import { useUsers } from 'src/hooks/users/use-users';
import { paths } from 'src/paths';
import { UserListTable } from 'src/sections/admin/users/user-list-table';

const Page = () => {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({ username: '', userType: '', status: '' });
  const { users, isLoading, refetch } = useUsers(filters);

  const handleUsernameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, username: event.target.value }));
  }, []);

  const handleUserTypeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, userType: event.target.value as UserFilters['userType'] }));
  }, []);

  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, status: event.target.value as UserFilters['status'] }));
  }, []);

  const handleRefresh = useCallback(() => {
    setFilters({ username: '', userType: '', status: '' });
    refetch({ username: '', userType: '', status: '' });
  }, [refetch]);

  return (
    <>
      <Seo title="Administration: Users" />
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
              <Stack spacing={1}>
                <Typography variant="h4">Users</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.admin.users.create}
                  startIcon={
                    <SvgIcon>
                      <PlusIcon />
                    </SvgIcon>
                  }
                  variant="contained"
                >
                  Add User
                </Button>
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
                  onChange={handleUsernameChange}
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }}
                />
                <TextField
                  select
                  label="User Type"
                  value={filters.userType}
                  onChange={handleUserTypeChange as any}
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={filters.status}
                  onChange={handleStatusChange as any}
                  sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Locked">Locked</MenuItem>
                </TextField>
              </Stack>
              <Divider />
              <UserListTable
                items={users}
                isLoading={isLoading}
                currentUserId={currentUser?.userId}
                onRefresh={() => refetch()}
              />
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
