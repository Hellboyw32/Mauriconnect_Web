import type { CarDocumentSection } from '@libs/types';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import XIcon from '@untitled-ui/icons-react/build/esm/X';
import type { FC } from 'react';
import { useCallback } from 'react';
import { fileApi } from 'src/api/files';
import { FileList } from 'src/sections/booking/documents/file-list';

interface CarDocumentViewerDialogProps {
  carNumber: string;
  section: CarDocumentSection;
  sectionLabel: string;
  startDate: string;
  open: boolean;
  onClose: () => void;
}

export const CarDocumentViewerDialog: FC<CarDocumentViewerDialogProps> = (props) => {
  const { carNumber, section, sectionLabel, startDate, open, onClose } = props;

  const loadFiles = useCallback(
    () => fileApi.listCarFiles(carNumber, section, startDate),
    [carNumber, section, startDate]
  );

  const handleDownload = useCallback(
    (fileName: string) => fileApi.downloadCarFile(carNumber, section, startDate, fileName),
    [carNumber, section, startDate]
  );

  const handleDelete = useCallback(
    (fileName: string) => fileApi.deleteCarFile(carNumber, section, startDate, fileName),
    [carNumber, section, startDate]
  );

  return (
    <Dialog
      fullWidth
      maxWidth="md"
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
        <Typography variant="h6">{sectionLabel} Documents</Typography>
        <IconButton
          color="inherit"
          onClick={onClose}
        >
          <SvgIcon>
            <XIcon />
          </SvgIcon>
        </IconButton>
      </Stack>
      <DialogContent dividers>
        <FileList
          loadFiles={loadFiles}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
};
