import type { ApexOptions } from 'apexcharts';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import type { FC } from 'react';
import { Chart } from 'src/components/chart';
import { Seo } from 'src/components/seo';
import { useAdminAnalytics } from 'src/hooks/admin-analytics/use-admin-analytics';

interface StatCardProps {
  title: string;
  value: number;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'text.primary';
}

const StatCard: FC<StatCardProps> = ({ title, value, color = 'text.primary' }) => (
  <Card>
    <Stack
      spacing={1}
      sx={{ px: 3, py: 2.5 }}
    >
      <Typography
        color="text.secondary"
        variant="body2"
      >
        {title}
      </Typography>
      <Typography
        variant="h4"
        sx={{ color: color === 'text.primary' ? 'text.primary' : `${color}.main` }}
      >
        {value}
      </Typography>
    </Stack>
  </Card>
);

const useDonutOptions = (labels: string[]): ApexOptions => {
  const theme = useTheme();

  return {
    chart: { background: 'transparent' },
    colors: [theme.palette.primary.main, theme.palette.neutral?.[400] || theme.palette.grey[400]],
    labels,
    legend: { position: 'bottom' },
    theme: { mode: theme.palette.mode },
    dataLabels: { enabled: true }
  };
};

const useBarOptions = (): ApexOptions => {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', toolbar: { show: false } },
    colors: [theme.palette.success.main, theme.palette.error.main],
    dataLabels: { enabled: true },
    plotOptions: { bar: { columnWidth: '40%' } },
    theme: { mode: theme.palette.mode },
    xaxis: { categories: ['Today', 'This Week'] }
  };
};

const Page = () => {
  const { analytics, isLoading } = useAdminAnalytics();
  const donutOptions = useDonutOptions(['Normal', 'Admin']);
  const barOptions = useBarOptions();

  if (isLoading || !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { users, logins, recentActivity } = analytics;

  const donutSeries = [users.NormalUsers, users.AdminUsers];
  const barSeries = [
    { name: 'Successful', data: [logins.SuccessfulLoginsToday, logins.SuccessfulLoginsThisWeek] },
    { name: 'Failed', data: [logins.FailedLoginsToday, logins.FailedLoginsThisWeek] }
  ];

  return (
    <>
      <Seo title="Administration: Analytics" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Typography variant="h4">Administrator Analytics</Typography>

            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Total Users"
                  value={users.TotalUsers}
                />
              </Grid>
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Active Users"
                  value={users.ActiveUsers}
                  color="success"
                />
              </Grid>
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Inactive Users"
                  value={users.InactiveUsers}
                />
              </Grid>
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Locked Accounts"
                  value={users.LockedUsers}
                  color="error"
                />
              </Grid>
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Normal Users"
                  value={users.NormalUsers}
                />
              </Grid>
              <Grid
                xs={12}
                sm={6}
                md={2}
              >
                <StatCard
                  title="Administrators"
                  value={users.AdminUsers}
                  color="primary"
                />
              </Grid>
            </Grid>

            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                md={5}
              >
                <Card>
                  <CardHeader title="Users by Type" />
                  <CardContent>
                    <Chart
                      options={donutOptions}
                      series={donutSeries}
                      type="donut"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid
                xs={12}
                md={7}
              >
                <Card>
                  <CardHeader title="Login Activity" />
                  <CardContent>
                    <Chart
                      options={barOptions}
                      series={barSeries}
                      type="bar"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardHeader title="Recent Activity" />
              <Divider />
              <Stack
                divider={<Divider />}
                sx={{ maxHeight: 420, overflowY: 'auto' }}
              >
                {recentActivity.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Typography color="text.secondary">No recent activity</Typography>
                  </Box>
                ) : (
                  recentActivity.map((log) => (
                    <Stack
                      key={log.Id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2">
                          <strong>{log.Username || 'System'}</strong> — {log.Action}
                        </Typography>
                        {log.Description && (
                          <Typography
                            color="text.secondary"
                            variant="caption"
                          >
                            {log.Description}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        color="text.secondary"
                        variant="caption"
                        title={format(new Date(log.Timestamp), 'dd MMM yyyy HH:mm:ss')}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {formatDistanceToNow(new Date(log.Timestamp), { addSuffix: true })}
                      </Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
