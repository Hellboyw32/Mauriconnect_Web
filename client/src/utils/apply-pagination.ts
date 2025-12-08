type Document = any;

export function applyPagination<T = Document>(
  documents: T[],
  page: number,
  rowsPerPage: number
): T[] {
  if (rowsPerPage === -1) return documents;
  return documents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
