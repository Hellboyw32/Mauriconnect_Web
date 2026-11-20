import { EXPENSE_DOCUMENT_MAX_BYTES } from '@libs/constants';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Upload01Icon from '@untitled-ui/icons-react/build/esm/Upload01';
import XIcon from '@untitled-ui/icons-react/build/esm/X';
import type { FC } from 'react';
import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FileIcon } from 'src/components/file-icon';
import { bytesToSize } from 'src/utils/bytes-to-size';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

interface ExpenseDocumentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

// Stages supplier invoices / receipts to be uploaded when the expense is saved
// (unlike the shared FileDropzone, there is no separate "Upload" button here).
export const ExpenseDocumentPicker: FC<ExpenseDocumentPickerProps> = (props) => {
  const { files, onChange, disabled = false } = props;

  const handleDrop = useCallback(
    (accepted: File[]) => {
      // Ignore a file already staged under the same name and size.
      const fresh = accepted.filter(
        (file) => !files.some((existing) => existing.name === file.name && existing.size === file.size)
      );
      onChange([...files, ...fresh]);
    },
    [files, onChange]
  );

  const handleRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach((rejection) => {
      const reason =
        rejection.errors[0]?.code === 'file-too-large'
          ? 'is too large (max 10MB)'
          : 'is not allowed (use PDF, JPG, JPEG or PNG)';
      toast.error(`${rejection.file.name} ${reason}`);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: EXPENSE_DOCUMENT_MAX_BYTES,
    disabled,
    onDrop: handleDrop,
    onDropRejected: handleRejected
  });

  return (
    <div>
      <Box
        {...getRootProps()}
        sx={{
          alignItems: 'center',
          border: 1,
          borderRadius: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center',
          outline: 'none',
          p: 4,
          opacity: disabled ? 0.5 : 1,
          ...(isDragActive && { backgroundColor: 'action.hover' }),
          '&:hover': { backgroundColor: 'action.hover', cursor: disabled ? 'default' : 'pointer' }
        }}
      >
        <input {...getInputProps()} />
        <Stack
          alignItems="center"
          direction="row"
          spacing={2}
        >
          <Avatar sx={{ height: 48, width: 48 }}>
            <SvgIcon>
              <Upload01Icon />
            </SvgIcon>
          </Avatar>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">Click to add documents or drag and drop</Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              Supplier invoice or receipt - PDF, JPG, JPEG or PNG, up to 10MB each. You can add several.
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {files.length > 0 && (
        <List sx={{ mt: 1 }}>
          {files.map((file) => (
            <ListItem
              key={`${file.name}-${file.size}`}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, '& + &': { mt: 1 } }}
            >
              <ListItemIcon>
                <FileIcon extension={file.name.split('.').pop()} />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondary={bytesToSize(file.size)}
              />
              <Tooltip title="Remove">
                <IconButton
                  edge="end"
                  disabled={disabled}
                  onClick={() => onChange(files.filter((existing) => existing !== file))}
                >
                  <SvgIcon>
                    <XIcon />
                  </SvgIcon>
                </IconButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};
