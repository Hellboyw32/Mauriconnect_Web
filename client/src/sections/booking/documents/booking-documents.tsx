import type { FC } from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import SvgIcon from '@mui/material/SvgIcon';
import UploadIcon from '@untitled-ui/icons-react/build/esm/Upload01';
import { fileApi } from 'src/api/files';
import { FileUploader } from './file-uploader';
import { FileList } from './file-list';

interface BookingDocumentsProps {
  referenceNo: string;
}

export const BookingDocuments: FC<BookingDocumentsProps> = (props) => {
  const { referenceNo } = props;
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Documents"
          action={
            <Button
              startIcon={
                <SvgIcon>
                  <UploadIcon />
                </SvgIcon>
              }
              variant="contained"
              onClick={() => setUploaderOpen(true)}
            >
              Upload Files
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <FileList
            loadFiles={() => fileApi.listFiles(referenceNo)}
            onDownload={(fileName) => fileApi.downloadFile(referenceNo, fileName)}
            onDelete={(fileName) => fileApi.deleteFile(referenceNo, fileName)}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      <FileUploader
        referenceNo={referenceNo}
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
};
