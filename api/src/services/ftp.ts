import { Service } from 'typedi';
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from '@/types';

export interface FTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}

export interface UploadFileRequest {
  referenceNo: string;
  fileName: string;
  fileBuffer: Buffer;
}

export interface FileInfo {
  name: string;
  size: number;
  modifiedAt: Date;
  path: string;
}

@Service()
export class FTPService {
  private config: FTPConfig;
  private useFallback: boolean = false;
  private localStoragePath: string = path.join(process.cwd(), 'uploads');

  constructor() {
    // Load FTP configuration from environment variables
    this.config = {
      host: process.env.FTP_HOST || 'localhost',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USER || 'anonymous',
      password: process.env.FTP_PASSWORD || '',
      secure: false // Force non-secure connection first
    };

    // Create local storage directory if it doesn't exist
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  private async getClient(): Promise<ftp.Client | null> {
    if (this.useFallback) {
      console.log('Using local file storage fallback');
      return null;
    }

    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === 'development';
    client.ftp.timeout = 30000;

    try {
      console.log('Attempting FTP connection to:', this.config.host);
      console.log('Using username:', this.config.user);

      // Explicitly force non-secure connection
      await client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        secure: false,
        secureOptions: {
          rejectUnauthorized: false
        }
      });

      console.log('FTP connection successful');
      return client;
    } catch (error) {
      console.error('FTP connection error:', error);
      console.error('FTP Config (password hidden):', {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        secure: this.config.secure
      });
      console.warn('Falling back to local file storage');
      this.useFallback = true;
      return null;
    }
  }

  async uploadFile(request: UploadFileRequest): Promise<Response<{ filePath: string }>> {
    const client = await this.getClient();

    try {
      // Create directory for booking reference number
      const dirPath = `/bookings/${request.referenceNo}`;

      try {
        await client.ensureDir(dirPath);
      } catch (error) {
        console.error('Error creating directory:', error);
      }

      // Upload file
      const filePath = `${dirPath}/${request.fileName}`;
      const tempFilePath = path.join('/tmp', request.fileName);

      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, request.fileBuffer);

      await client.uploadFrom(tempFilePath, filePath);

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        message: 'File uploaded successfully',
        data: { filePath },
        success: true
      };
    } catch (error) {
      console.error('FTP upload error:', error);
      return {
        status: 500,
        message: `Upload failed: ${error}`,
        error,
        success: false
      };
    } finally {
      client.close();
    }
  }

  async listFiles(referenceNo: string): Promise<Response<FileInfo[]>> {
    const client = await this.getClient();

    try {
      const dirPath = `/bookings/${referenceNo}`;

      await client.cd(dirPath);
      const files = await client.list();

      const fileInfos: FileInfo[] = files
        .filter((file) => file.type === ftp.FileType.File)
        .map((file) => ({
          name: file.name,
          size: file.size,
          modifiedAt: file.modifiedAt || new Date(),
          path: `${dirPath}/${file.name}`
        }));

      return {
        status: 200,
        message: 'Files retrieved successfully',
        data: fileInfos,
        success: true
      };
    } catch (error) {
      console.error('FTP list error:', error);
      return {
        status: 200,
        message: 'No files found',
        data: [],
        success: true
      };
    } finally {
      client.close();
    }
  }

  async downloadFile(referenceNo: string, fileName: string): Promise<Response<Buffer>> {
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(this.localStoragePath, referenceNo, fileName);

        if (!fs.existsSync(filePath)) {
          return {
            status: 404,
            message: 'File not found',
            error: new Error('File not found'),
            success: false
          };
        }

        const fileBuffer = fs.readFileSync(filePath);

        return {
          status: 200,
          message: 'File downloaded successfully (local storage)',
          data: fileBuffer,
          success: true
        };
      } catch (error) {
        console.error('Local storage download error:', error);
        return {
          status: 500,
          message: `Download failed: ${error}`,
          error,
          success: false
        };
      }
    }

    // Use FTP
    try {
      const filePath = `/bookings/${referenceNo}/${fileName}`;
      const tempFilePath = path.join(process.cwd(), 'temp', `download_${fileName}`);

      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await client.downloadTo(tempFilePath, filePath);
      const fileBuffer = fs.readFileSync(tempFilePath);
      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        message: 'File downloaded successfully',
        data: fileBuffer,
        success: true
      };
    } catch (error) {
      console.error('FTP download error:', error);
      return {
        status: 500,
        message: `Download failed: ${error}`,
        error,
        success: false
      };
    } finally {
      client.close();
    }
  }

  async deleteFile(referenceNo: string, fileName: string): Promise<Response<void>> {
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(this.localStoragePath, referenceNo, fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return {
          status: 200,
          message: 'File deleted successfully (local storage)',
          success: true
        };
      } catch (error) {
        console.error('Local storage delete error:', error);
        return {
          status: 500,
          message: `Delete failed: ${error}`,
          error,
          success: false
        };
      }
    }

    // Use FTP
    try {
      const filePath = `/bookings/${referenceNo}/${fileName}`;
      await client.remove(filePath);

      return {
        status: 200,
        message: 'File deleted successfully',
        success: true
      };
    } catch (error) {
      console.error('FTP delete error:', error);
      return {
        status: 500,
        message: `Delete failed: ${error}`,
        error,
        success: false
      };
    } finally {
      client.close();
    }
  }
}
