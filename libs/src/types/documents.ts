export interface Document {
  createdAt?: Date | null;
  directory?: string;
  documentId: string;
  extension?: string;
  name: string;
  size: number;
  updatedAt?: Date | null;
}
