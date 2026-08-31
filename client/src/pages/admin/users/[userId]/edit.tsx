import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { Seo } from 'src/components/seo';
import { useUser } from 'src/hooks/users/use-user';
import { UserForm } from 'src/sections/admin/users/user-form';

const Page = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId ? parseInt(params.userId, 10) : undefined;
  const { user, isLoading } = useUser(userId);

  return (
    <>
      <Seo title="Administration: Edit User" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="md">
          <Stack spacing={4}>
            <Typography variant="h4">Edit User{user ? `: ${user.Username}` : ''}</Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <UserForm
                mode="edit"
                user={user}
              />
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
