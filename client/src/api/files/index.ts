import { API_ENDPOINTS } from '@libs/constants';
import axios from 'axios';

export interface FileInfo {
  name: string;
  size: number;
  modifiedAt: Date;
  path: string;
}

interface UploadResponse {
  status: number;
  message: string;
  data?: { filePath: string };
  success: boolean;
}

interface ListFilesResponse {
  status: number;
  message: string;
  data?: FileInfo[];
  success: boolean;
}

interface IFileApi {
  uploadFile(referenceNo: string, file: File): Promise<UploadResponse>;
  listFiles(referenceNo: string): Promise<FileInfo[]>;
  downloadFile(referenceNo: string, fileName: string): Promise<Blob>;
  deleteFile(referenceNo: string, fileName: string): Promise<boolean>;
}

class FileApi implements IFileApi {
  private baseUrl: string = import.meta.env.VITE_API_BASE_URL;

  public async uploadFile(referenceNo: string, file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('referenceNo', referenceNo);

      const response = await axios.post<UploadResponse>(
        `${this.baseUrl}${API_ENDPOINTS.FILES}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  public async listFiles(referenceNo: string): Promise<FileInfo[]> {
    try {
      const response = await axios.get<ListFilesResponse>(
        `${this.baseUrl}${API_ENDPOINTS.FILES}/${referenceNo}`
      );

      return response.data.data || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  public async downloadFile(referenceNo: string, fileName: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.baseUrl}${API_ENDPOINTS.FILES}/${referenceNo}/${fileName}`,
        {
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  public async deleteFile(referenceNo: string, fileName: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}${API_ENDPOINTS.FILES}/${referenceNo}/${fileName}`
      );

      return response.data.success;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}

export const fileApi = new FileApi();
