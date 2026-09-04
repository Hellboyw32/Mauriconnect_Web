import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SvgIcon from '@mui/material/SvgIcon';
import DownloadIcon from '@untitled-ui/icons-react/build/esm/Download01';
import TrashIcon from '@untitled-ui/icons-react/build/esm/Trash01';
import FileIcon from '@untitled-ui/icons-react/build/esm/File04';
import EyeIcon from '@untitled-ui/icons-react/build/esm/Eye';
import CloseIcon from '@untitled-ui/icons-react/build/esm/X';
import RotateLeftIcon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import RotateRightIcon from '@untitled-ui/icons-react/build/esm/RefreshCw01';
import { toast } from 'react-hot-toast';
import { fileApi, type FileInfo } from 'src/api/files';
import { format } from 'date-fns';

interface FileListProps {
  referenceNo: string;
  refreshTrigger?: number;
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  // Image extensions
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return 'image';
  }

  // PDF
  if (ext === 'pdf') {
    return 'pdf';
  }

  // Document
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
    return 'document';
  }

  // Spreadsheet
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return 'spreadsheet';
  }

  return 'file';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const FileList: FC<FileListProps> = (props) => {
  const { referenceNo, refreshTrigger } = props;
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(
    null
  );
  const [rotation, setRotation] = useState(0);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const fileList = await fileApi.listFiles(referenceNo);
      setFiles(fileList);

      // Load thumbnails for image files
      const thumbPromises = fileList
        .filter((file) => getFileIcon(file.name) === 'image')
        .map(async (file) => {
          try {
            const blob = await fileApi.downloadFile(referenceNo, file.name);
            const url = URL.createObjectURL(blob);
            return { name: file.name, url };
          } catch (error) {
            console.error(`Failed to load thumbnail for ${file.name}`, error);
            return null;
          }
        });

      const thumbResults = await Promise.all(thumbPromises);
      const thumbMap: Record<string, string> = {};
      thumbResults.forEach((result) => {
        if (result) {
          thumbMap[result.name] = result.url;
        }
      });
      setThumbnails(thumbMap);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [referenceNo]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshTrigger]);

  const handleDownload = useCallback(
    async (fileName: string) => {
      try {
        const blob = await fileApi.downloadFile(referenceNo, fileName);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('File downloaded successfully');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    },
    [referenceNo]
  );

  const handlePreview = useCallback(
    async (fileName: string, fileType: string) => {
      try {
        const url =
          thumbnails[fileName] ||
          URL.createObjectURL(await fileApi.downloadFile(referenceNo, fileName));
        setRotation(0);
        setPreviewFile({ name: fileName, url, type: fileType });
      } catch (error) {
        console.error('Preview error:', error);
        toast.error('Failed to preview file');
      }
    },
    [referenceNo, thumbnails]
  );

  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
    setRotation(0);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDelete = useCallback(
    async (fileName: string) => {
      if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
        return;
      }

      try {
        const success = await fileApi.deleteFile(referenceNo, fileName);
        if (success) {
          toast.success('File deleted successfully');
          loadFiles();
        } else {
          toast.error('Failed to delete file');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete file');
      }
    },
    [referenceNo, loadFiles]
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        py={4}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Box
        py={4}
        textAlign="center"
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          No files uploaded yet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
      >
      {files.map((file) => {
        const fileType = getFileIcon(file.name);
        const thumbnail = thumbnails[file.name];
        const isPreviewable = fileType === 'image' || fileType === 'pdf';

        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={file.name}
          >
            <Card>
              {fileType === 'image' && thumbnail ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={thumbnail}
                  alt={file.name}
                  onClick={() => handlePreview(file.name, fileType)}
                  sx={{ objectFit: 'cover', cursor: 'pointer' }}
                />
              ) : (
                <Box
                  onClick={isPreviewable ? () => handlePreview(file.name, fileType) : undefined}
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'neutral.100',
                    cursor: isPreviewable ? 'pointer' : 'default'
                  }}
                >
                  <SvgIcon sx={{ fontSize: 48, color: 'text.secondary' }}>
                    <FileIcon />
                  </SvgIcon>
                </Box>
              )}
              <CardContent>
                <Typography
                  variant="subtitle2"
                  noWrap
                  title={file.name}
                  gutterBottom
                >
                  {file.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  mb={1}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatFileSize(file.size)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    •
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {format(new Date(file.modifiedAt), 'MMM d, yyyy')}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                >
                  {isPreviewable && (
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(file.name, fileType)}
                      title="Preview"
                    >
                      <SvgIcon fontSize="small">
                        <EyeIcon />
                      </SvgIcon>
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(file.name)}
                    title="Download"
                  >
                    <SvgIcon fontSize="small">
                      <DownloadIcon />
                    </SvgIcon>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(file.name)}
                    title="Delete"
                    color="error"
                  >
                    <SvgIcon fontSize="small">
                      <TrashIcon />
                    </SvgIcon>
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
      </Grid>

      <Dialog
        open={!!previewFile}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Typography
            variant="subtitle1"
            noWrap
          >
            {previewFile?.name}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            {previewFile?.type === 'image' && (
              <>
                <IconButton
                  size="small"
                  onClick={handleRotateLeft}
                  title="Rotate left"
                >
                  <SvgIcon fontSize="small">
                    <RotateLeftIcon />
                  </SvgIcon>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleRotateRight}
                  title="Rotate right"
                >
                  <SvgIcon fontSize="small">
                    <RotateRightIcon />
                  </SvgIcon>
                </IconButton>
              </>
            )}
            <IconButton
              size="small"
              onClick={handleClosePreview}
            >
              <SvgIcon fontSize="small">
                <CloseIcon />
              </SvgIcon>
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, height: '80vh', backgroundColor: 'neutral.100' }}
        >
          {previewFile?.type === 'image' ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <Box
                component="img"
                src={previewFile.url}
                alt={previewFile.name}
                sx={{
                  maxWidth: rotation % 180 === 0 ? '100%' : '80vh',
                  maxHeight: rotation % 180 === 0 ? '100%' : '100%',
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
              />
            </Box>
          ) : (
            <Box
              component="iframe"
              src={previewFile?.url}
              title={previewFile?.name}
              sx={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
