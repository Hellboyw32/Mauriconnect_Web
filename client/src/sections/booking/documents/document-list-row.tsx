import type { Document } from '@libs/types';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import DotsVerticalIcon from '@untitled-ui/icons-react/build/esm/DotsVertical';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useCallback, type FC } from 'react';
import { usePopover } from 'src/hooks/use-popover';
import { bytesToSize } from 'src/utils/bytes-to-size';
import { DocumentIcon } from './document-icon';
import { DocumentMenu } from './document-menu';

interface DocumentListRowProps {
  document: Document;
  onDelete?: (documentId: string) => void;
}

export const DocumentListRow: FC<DocumentListRowProps> = (props) => {
  const { document, onDelete } = props;
  const popover = usePopover<HTMLButtonElement>();
  const assetsBaseHref = 'http://localhost:3000/assets/uploads'; // TODO: Move to .env file

  const size = bytesToSize(document.size);
  const createdAt = document.createdAt && format(document.createdAt, 'MMM dd, yyyy');

  const handleDelete = useCallback((): void => {
    popover.handleClose();
    onDelete?.(document.documentId);
  }, [document, popover, onDelete]);

  const handleCopy = useCallback((): void => {
    popover.handleClose();
    const { directory, name } = document;
    const link = `${assetsBaseHref}${directory}${name}`;
    navigator.clipboard.writeText(link);
  }, [document, popover]);

  return (
    <>
      <TableRow
        key={document.documentId}
        sx={{
          backgroundColor: 'transparent',
          borderRadius: 1.5,
          boxShadow: 0,
          transition: (theme) =>
            theme.transitions.create(['background-color', 'box-shadow'], {
              easing: theme.transitions.easing.easeInOut,
              duration: 200
            }),
          '&:hover': {
            backgroundColor: 'background.paper',
            boxShadow: 16
          },
          [`& .${tableCellClasses.root}`]: {
            borderBottomWidth: 1,
            borderBottomColor: 'divider',
            borderBottomStyle: 'solid',
            borderTopWidth: 1,
            borderTopColor: 'divider',
            borderTopStyle: 'solid',
            '&:first-of-type': {
              borderTopLeftRadius: (theme) => theme.shape.borderRadius * 1.5,
              borderBottomLeftRadius: (theme) => theme.shape.borderRadius * 1.5,
              borderLeftWidth: 1,
              borderLeftColor: 'divider',
              borderLeftStyle: 'solid'
            },
            '&:last-of-type': {
              borderTopRightRadius: (theme) => theme.shape.borderRadius * 1.5,
              borderBottomRightRadius: (theme) => theme.shape.borderRadius * 1.5,
              borderRightWidth: 1,
              borderRightColor: 'divider',
              borderRightStyle: 'solid'
            }
          }
        }}
      >
        <TableCell>
          <Stack
            alignItems="center"
            direction="row"
            spacing={2}
          >
            <Box sx={{ cursor: 'pointer' }}>
              <DocumentIcon extension={document.extension} />
            </Box>
            <div>
              <Typography
                noWrap
                sx={{ cursor: 'pointer' }}
                variant="subtitle2"
              >
                {document.name}
              </Typography>
              <Typography
                color="text.secondary"
                noWrap
                variant="body2"
              >
                {size}
              </Typography>
            </div>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography
            noWrap
            variant="subtitle2"
          >
            Created at
          </Typography>
          <Typography
            color="text.secondary"
            noWrap
            variant="body2"
          >
            {createdAt!}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <IconButton
            onClick={popover.handleOpen}
            ref={popover.anchorRef}
          >
            <SvgIcon fontSize="small">
              <DotsVerticalIcon />
            </SvgIcon>
          </IconButton>
        </TableCell>
      </TableRow>
      <DocumentMenu
        anchorEl={popover.anchorRef.current}
        onCopy={handleCopy}
        onClose={popover.handleClose}
        onDelete={handleDelete}
        open={popover.open}
      />
    </>
  );
};

DocumentListRow.propTypes = {
  // @ts-ignore
  document: PropTypes.object.isRequired,
  onDelete: PropTypes.func
};
