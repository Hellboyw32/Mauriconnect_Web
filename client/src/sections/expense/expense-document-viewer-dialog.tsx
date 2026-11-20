import type { ExpenseAttachment } from '@libs/types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import XIcon from '@untitled-ui/icons-react/build/esm/X';
import { format } from 'date-fns';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { expenseApi } from 'src/api/expense';
import { bytesToSize } from 'src/utils/bytes-to-size';

interface ExpenseDocumentViewerDialogProps {
  expenseId: number;
  open: boolean;
  onClose: () => void;
  // Show a Remove button per document (owner / admin editing the expense).
  allowRemove?: boolean;
  // Called after a document is removed so the caller can refresh counts.
  onChanged?: () => void;
}

const isPdf = (attachment: ExpenseAttachment) => /\.pdf$/i.test(attachment.FileName);
const isImage = (attachment: ExpenseAttachment) => /\.(png|jpe?g)$/i.test(attachment.FileName);

export const ExpenseDocumentViewerDialog: FC<ExpenseDocumentViewerDialogProps> = (props) => {
  const { expenseId, open, onClose, allowRemove = false, onChanged } = props;
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = attachments.find((attachment) => attachment.AttachmentId === selectedId) ?? null;

  const loadAttachments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await expenseApi.getAttachments(expenseId);
      setAttachments(items);
      setSelectedId((current) =>
        items.some((item) => item.AttachmentId === current) ? current : (items[0]?.AttachmentId ?? null)
      );
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (open) {
      loadAttachments();
    }
  }, [open, loadAttachments]);

  // Fetch the selected document as a blob (the API needs the auth header) and
  // show it via an object URL, released when the selection changes or closes.
  useEffect(() => {
    if (!open || !selected || (!isPdf(selected) && !isImage(selected))) {
      setPreviewUrl(null);
      return undefined;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setIsPreviewLoading(true);
    setPreviewUrl(null);

    expenseApi
      .getAttachmentBlob(expenseId, selected.AttachmentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((err) => !cancelled && setError(err.message || 'Failed to load the document'))
      .finally(() => !cancelled && setIsPreviewLoading(false));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, expenseId, selected]);

  const handleDownload = useCallback(async () => {
    if (!selected) return;

    try {
      const blob = await expenseApi.getAttachmentBlob(expenseId, selected.AttachmentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selected.FileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Failed to download the document');
    }
  }, [expenseId, selected]);

  const handleRemove = useCallback(async () => {
    if (!selected || !window.confirm(`Remove "${selected.FileName}" from this expense?`)) return;

    try {
      await expenseApi.deleteAttachment(expenseId, selected.AttachmentId);
      toast.success('Document removed');
      await loadAttachments();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Failed to remove the document');
    }
  }, [expenseId, selected, loadAttachments, onChanged]);

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ px: 3, py: 2 }}
      >
        <Typography variant="h6">Supporting documents</Typography>
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
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : attachments.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: 'center' }}
          >
            No documents uploaded for this expense.
          </Typography>
        ) : (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
          >
            <List sx={{ minWidth: 260, maxWidth: { md: 300 }, flexShrink: 0 }}>
              {attachments.map((attachment) => (
                <ListItemButton
                  key={attachment.AttachmentId}
                  selected={attachment.AttachmentId === selectedId}
                  onClick={() => setSelectedId(attachment.AttachmentId)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primary={attachment.FileName}
                    primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
                    secondary={`${attachment.FileSize ? `${bytesToSize(attachment.FileSize)} - ` : ''}${format(
                      new Date(attachment.UploadedDate),
                      'dd/MM/yyyy HH:mm'
                    )} - ${attachment.UploadedBy}`}
                  />
                </ListItemButton>
              ))}
            </List>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Button
                  onClick={handleDownload}
                  size="small"
                  variant="outlined"
                >
                  Download
                </Button>
                {allowRemove && (
                  <Button
                    color="error"
                    onClick={handleRemove}
                    size="small"
                    variant="outlined"
                  >
                    Remove
                  </Button>
                )}
              </Stack>
              <Box
                sx={{
                  alignItems: 'center',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  height: '65vh',
                  justifyContent: 'center',
                  overflow: 'auto'
                }}
              >
                {isPreviewLoading ? (
                  <CircularProgress />
                ) : previewUrl && selected && isPdf(selected) ? (
                  <iframe
                    src={previewUrl}
                    title={selected.FileName}
                    style={{ border: 0, height: '100%', width: '100%' }}
                  />
                ) : previewUrl && selected && isImage(selected) ? (
                  <Box
                    alt={selected.FileName}
                    component="img"
                    src={previewUrl}
                    sx={{ maxHeight: '100%', maxWidth: '100%' }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    Preview not available - use Download to open this file.
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
