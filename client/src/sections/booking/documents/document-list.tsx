import type { Document } from '@libs/types';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import type { FC } from 'react';
import { Scrollbar } from 'src/components/scrollbar';
import { DocumentListRow } from './document-list-row';

interface DocumentListProps {
  documents?: Document[];
  onDelete?: (documentId: string) => void;
}

export const DocumentList: FC<DocumentListProps> = (props) => {
  const { documents = [], onDelete } = props;

  return (
    <Stack spacing={4}>
      <Box sx={{ m: -3 }}>
        <Scrollbar>
          <Box sx={{ p: 3 }}>
            <Table
              sx={{
                minWidth: 600,
                borderCollapse: 'separate',
                borderSpacing: '0 8px'
              }}
            >
              <TableBody>
                {documents.map((document) => (
                  <DocumentListRow
                    document={document}
                    key={document.documentId}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        </Scrollbar>
      </Box>
    </Stack>
  );
};
