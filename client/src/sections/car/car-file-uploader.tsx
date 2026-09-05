import type { CarDocumentSection } from '@libs/types';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import XIcon from '@untitled-ui/icons-react/build/esm/X';
import PropTypes from 'prop-types';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { FileRejection } from 'react-dropzone';
import { toast } from 'react-hot-toast';

import { File, FileDropzone } from 'src/components/file-dropzone';
import { fileApi } from 'src/api/files';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
// Car documents only accept images + PDF, narrower than the booking uploader's set.
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf']
};

interface CarFileUploaderProps {
  carId: number;
  section: CarDocumentSection;
  sectionLabel: string;
  startDate: string;
  onClose?: () => void;
  onUploadComplete?: () => void;
  open?: boolean;
}

export const CarFileUploader: FC<CarFileUploaderProps> = (props) => {
  const { carId, section, sectionLabel, startDate, onClose, onUploadComplete, open = false } =
    props;
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFiles([]);
  }, [open]);

  const handleDrop = useCallback((newFiles: File[]): void => {
    // One record, one document: a new drop replaces whatever was staged.
    setFiles(newFiles.slice(-1));
  }, []);

  const handleRemove = useCallback((file: File): void => {
    setFiles((prevFiles) => {
      return prevFiles.filter((_file) => _file.path !== file.path);
    });
  }, []);

  const handleRemoveAll = useCallback((): void => {
    setFiles([]);
  }, []);

  const handleDropRejected = useCallback((rejections: FileRejection[]): void => {
    rejections.forEach((rejection) => {
      const reason =
        rejection.errors[0]?.code === 'file-too-large'
          ? 'is too large (max 10MB)'
          : 'has an unsupported file type (allowed: jpg, jpeg, png, pdf)';
      toast.error(`${rejection.file.name} ${reason}`);
    });
  }, []);

  const handleUpload = useCallback(async (): Promise<void> => {
    if (files.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!startDate) {
      toast.error('This record has no Start Date, so a destination folder cannot be determined');
      return;
    }

    setUploading(true);

    try {
      const result = await fileApi.uploadCarFile(carId, section, startDate, files[0]);

      if (result.success) {
        toast.success(result.message || 'File uploaded successfully');
        setFiles([]);
        onUploadComplete?.();
        onClose?.();
      } else {
        toast.error(result.message || 'Failed to upload file');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [files, carId, section, startDate, onClose, onUploadComplete]);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={3}
        sx={{
          px: 3,
          py: 2
        }}
      >
        <Typography variant="h6">Upload {sectionLabel} Document</Typography>
        <IconButton
          color="inherit"
          onClick={onClose}
        >
          <SvgIcon>
            <XIcon />
          </SvgIcon>
        </IconButton>
      </Stack>
      <DialogContent>
        {uploading ? (
          <Stack
            alignItems="center"
            spacing={2}
            sx={{ py: 4 }}
          >
            <CircularProgress />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Uploading file to FTP server...
            </Typography>
          </Stack>
        ) : (
          <FileDropzone
            accept={ACCEPTED_FILE_TYPES}
            caption="Images (jpg, jpeg, png) or PDF. Max 10MB."
            files={files}
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            onDrop={handleDrop}
            onDropRejected={handleDropRejected}
            onRemove={handleRemove}
            onRemoveAll={handleRemoveAll}
            onUpload={handleUpload}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

CarFileUploader.propTypes = {
  carId: PropTypes.number.isRequired,
  section: PropTypes.oneOf<CarDocumentSection>(['RoadTax', 'Insurance', 'CarFitness']).isRequired,
  sectionLabel: PropTypes.string.isRequired,
  startDate: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onUploadComplete: PropTypes.func,
  open: PropTypes.bool
};
