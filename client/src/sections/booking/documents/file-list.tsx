import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import ZoomInIcon from '@untitled-ui/icons-react/build/esm/ZoomIn';
import ZoomOutIcon from '@untitled-ui/icons-react/build/esm/ZoomOut';
import { toast } from 'react-hot-toast';
import type { FileInfo } from 'src/api/files';
import { format } from 'date-fns';

interface FileListProps {
  loadFiles: () => Promise<FileInfo[]>;
  onDownload: (fileName: string) => Promise<Blob>;
  onDelete: (fileName: string) => Promise<boolean>;
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
  const { loadFiles: loadFilesFn, onDownload, onDelete, refreshTrigger } = props;
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    type: string;
    isAdHocUrl: boolean;
  } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Mirrors `thumbnails` so loadFiles can read the current cache synchronously without
  // depending on `thumbnails` itself (which it also writes to - that would either loop
  // or force stale reads through a stable useCallback).
  const thumbnailsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    thumbnailsRef.current = thumbnails;
  }, [thumbnails]);

  // Revoke every cached blob URL when the component unmounts (e.g. navigating away),
  // so nothing outlives the page.
  useEffect(() => {
    return () => {
      Object.values(thumbnailsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const fileList = await loadFilesFn();
      setFiles(fileList);

      // Files no longer play back into the grid as thumbnails eagerly (see
      // handlePreview) - each one downloads the full original over a brand-new FTP
      // connection, which measured 7-14s+ per file to even connect. Eagerly fetching
      // every image on every load/refresh is what made this page unusable with more
      // than a couple of files. Still revoke cached blobs (from earlier on-demand
      // previews) for files that were deleted, so nothing lingers past its file.
      const currentNames = new Set(fileList.map((file) => file.name));
      const cachedThumbnails = thumbnailsRef.current;

      Object.entries(cachedThumbnails).forEach(([name, url]) => {
        if (!currentNames.has(name)) {
          URL.revokeObjectURL(url);
        }
      });

      setThumbnails((prev) => {
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([name, url]) => {
          if (currentNames.has(name)) {
            next[name] = url;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [loadFilesFn]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshTrigger]);

  const handleDownload = useCallback(
    async (fileName: string) => {
      try {
        const blob = await onDownload(fileName);
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
    [onDownload]
  );

  const handlePreview = useCallback(
    async (fileName: string, fileType: string) => {
      try {
        const cachedUrl = thumbnails[fileName];
        const url = cachedUrl || URL.createObjectURL(await onDownload(fileName));
        setRotation(0);
        setZoom(1);
        // Only PDF previews create a fresh, uncached URL here (image previews reuse
        // the cached thumbnail) - track that so closing the dialog can revoke it
        // without touching the thumbnail cache other parts of the UI still need.
        setPreviewFile({ name: fileName, url, type: fileType, isAdHocUrl: !cachedUrl });
      } catch (error) {
        console.error('Preview error:', error);
        toast.error('Failed to preview file');
      }
    },
    [onDownload, thumbnails]
  );

  const handleClosePreview = useCallback(() => {
    setPreviewFile((prev) => {
      if (prev?.isAdHocUrl) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    setRotation(0);
    setZoom(1);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleDelete = useCallback(
    async (fileName: string) => {
      if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
        return;
      }

      try {
        const success = await onDelete(fileName);
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
    [onDelete, loadFiles]
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
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  title="Zoom out"
                >
                  <SvgIcon fontSize="small">
                    <ZoomOutIcon />
                  </SvgIcon>
                </IconButton>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 40, textAlign: 'center' }}
                >
                  {Math.round(zoom * 100)}%
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  title="Zoom in"
                >
                  <SvgIcon fontSize="small">
                    <ZoomInIcon />
                  </SvgIcon>
                </IconButton>
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
                // 'auto' (not 'hidden') so a zoomed-in image can be scrolled/panned
                // into view instead of just clipping at the dialog edges.
                overflow: 'auto'
              }}
            >
              <Box
                component="img"
                src={previewFile.url}
                alt={previewFile.name}
                onWheel={(event) => {
                  if (!event.ctrlKey && !event.metaKey) return;
                  event.preventDefault();
                  if (event.deltaY < 0) {
                    handleZoomIn();
                  } else {
                    handleZoomOut();
                  }
                }}
                sx={{
                  maxWidth: rotation % 180 === 0 ? '100%' : '80vh',
                  maxHeight: rotation % 180 === 0 ? '100%' : '100%',
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.2s ease-in-out',
                  cursor: zoom > 1 ? 'move' : 'default'
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
