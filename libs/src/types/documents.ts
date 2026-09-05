export interface Document {
  createdAt?: Date | null;
  directory?: string;
  documentId: string;
  extension?: string;
  name: string;
  size: number;
  updatedAt?: Date | null;
}

// Section of a car record that supports FTP document uploads, and the FTP
// folder name each maps to under /Dropbox/Cars/[CarId]/[Section]/[StartDate]/.
export type CarDocumentSection = 'RoadTax' | 'Insurance' | 'CarFitness';

export interface CarFileUploadResponse {
  status: number;
  message: string;
  data?: { filePath: string };
  success: boolean;
}
