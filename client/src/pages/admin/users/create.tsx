import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Seo } from 'src/components/seo';
import { UserForm } from 'src/sections/admin/users/user-form';

const Page = () => {
  return (
    <>
      <Seo title="Administration: Create User" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="md">
          <Stack spacing={4}>
            <Typography variant="h4">Create User</Typography>
            <UserForm mode="create" />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
