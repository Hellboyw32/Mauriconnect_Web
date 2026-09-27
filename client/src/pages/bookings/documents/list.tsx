import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import Upload01Icon from '@untitled-ui/icons-react/build/esm/Upload01';
import { useCallback, useState } from 'react';
import { fileApi } from 'src/api/files';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useBooking as useSingleBooking } from 'src/hooks/bookings/use-single-booking';
import { useDialog } from 'src/hooks/use-dialog';
import { paths } from 'src/paths';
import { FileList } from 'src/sections/booking/documents/file-list';
import { FileUploader } from 'src/sections/booking/documents/file-uploader';

const Page = () => {
  const booking = useSingleBooking();
  const uploadDialog = useDialog();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = useCallback((): void => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <>
      <Seo title="Booking: Document Manager" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.bookings.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Bookings</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">Documents: {booking?.CustomerName}</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={3}
              >
                <Button
                  onClick={uploadDialog.handleOpen}
                  startIcon={
                    <SvgIcon>
                      <Upload01Icon />
                    </SvgIcon>
                  }
                  variant="contained"
                >
                  Upload
                </Button>
              </Stack>
            </Stack>
            <Stack
              spacing={{
                xs: 3,
                lg: 4
              }}
            >
              <FileList
                loadFiles={() => fileApi.listFiles(booking?.ReferenceNo ?? '')}
                onDownload={(fileName) => fileApi.downloadFile(booking?.ReferenceNo ?? '', fileName)}
                onDelete={(fileName) => fileApi.deleteFile(booking?.ReferenceNo ?? '', fileName)}
                refreshTrigger={refreshTrigger}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>
      <FileUploader
        referenceNo={booking?.ReferenceNo ?? ''}
        onClose={uploadDialog.handleClose}
        onUploadComplete={handleUploadComplete}
        open={uploadDialog.open}
      />
    </>
  );
};

export default Page;
