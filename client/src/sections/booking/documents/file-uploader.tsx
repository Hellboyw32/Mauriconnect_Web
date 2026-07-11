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
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

interface FileUploaderProps {
  referenceNo: string;
  onClose?: () => void;
  onUploadComplete?: () => void;
  open?: boolean;
}

export const FileUploader: FC<FileUploaderProps> = (props) => {
  const { referenceNo, onClose, onUploadComplete, open = false } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFiles([]);
  }, [open]);

  const handleDrop = useCallback((newFiles: File[]): void => {
    setFiles((prevFiles) => {
      return [...prevFiles, ...newFiles];
    });
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
      const reason = rejection.errors[0]?.code === 'file-too-large'
        ? 'is too large (max 10MB)'
        : 'has an unsupported file type';
      toast.error(`${rejection.file.name} ${reason}`);
    });
  }, []);

  const handleUpload = useCallback(async (): Promise<void> => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Convert File from FileDropzone to native File object
        if (!file.path) {
          throw new Error(`File ${file.name} has no path`);
        }
        const blob = await fetch(file.path).then((r) => r.blob());
        const nativeFile = new window.File([blob], file.name, { type: blob.type });

        return fileApi.uploadFile(referenceNo, nativeFile);
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount === files.length) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
        setFiles([]);
        onUploadComplete?.();
        onClose?.();
      } else {
        toast.error(`Uploaded ${successCount} of ${files.length} file(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [files, referenceNo, onClose, onUploadComplete]);

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
        <Typography variant="h6">Upload Files</Typography>
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
              Uploading files to FTP server...
            </Typography>
          </Stack>
        ) : (
          <FileDropzone
            accept={ACCEPTED_FILE_TYPES}
            caption="Images, PDF, or Word documents. Max 10MB per file."
            files={files}
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

FileUploader.propTypes = {
  referenceNo: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onUploadComplete: PropTypes.func,
  open: PropTypes.bool
};
