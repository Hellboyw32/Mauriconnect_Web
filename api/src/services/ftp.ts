import { Inject, Service } from 'typedi';
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Response } from '@/types';
import { BOOKING_STORED_PROCEDURES } from '@/constants';
import { BaseMSSqlService } from '../base/base-mssql';

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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];

// Windows path of the upload folder on the FTP server, used only to build a
// human-readable full path for storage in the database - not used for FTP transfers.
const FTP_ROOT_WINDOWS_PATH =
  process.env.FTP_ROOT_WINDOWS_PATH || 'C:\\inetpub\\MauriconnectFileUpload';

@Service()
export class FTPService {
  private config: FTPConfig;
  private useFallback: boolean = false;
  private localStoragePath: string = path.join(process.cwd(), 'uploads');

  @Inject()
  private readonly mssqlService: BaseMSSqlService;

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

  // The upload folder is organised by the year the booking was created
  // (C:\inetpub\MauriconnectFileUpload\{YEAR}\{ReferenceNo}\...), so every
  // file operation needs to resolve that year from the booking record first.
  private async getBookingYear(referenceNo: string): Promise<number> {
    try {
      const result = await this.mssqlService.requestByStoredProcedure<
        { BookingYear: number }[]
      >(BOOKING_STORED_PROCEDURES.GET_BOOKING_YEAR_BY_REFERENCE_NO, [
        { ReferenceNo: referenceNo }
      ]);

      const rows = (result.data as unknown as { BookingYear: number }[]) || [];
      return rows[0]?.BookingYear ?? new Date().getFullYear();
    } catch (error) {
      console.error('Error resolving booking year for reference:', referenceNo, error);
      return new Date().getFullYear();
    }
  }

  private buildStoredFileName(originalFileName: string): string {
    const sanitized = originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `${Date.now()}-${sanitized}`;
  }

  // Validates extension and size. Mirrors the multer-level checks on the
  // upload route, kept here too so uploadFile is safe to call directly.
  static validateFile(fileName: string, fileSizeBytes: number): string | null {
    const extension = path.extname(fileName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type "${extension || 'unknown'}" is not allowed. Allowed types: images (jpg, png, gif, webp), PDF, and Word documents.`;
    }

    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  }

  async uploadFile(request: UploadFileRequest): Promise<Response<{ filePath: string }>> {
    const validationError = FTPService.validateFile(
      request.fileName,
      request.fileBuffer.length
    );

    if (validationError) {
      return {
        status: 400,
        message: validationError,
        success: false
      };
    }

    const year = await this.getBookingYear(request.referenceNo);
    const storedFileName = this.buildStoredFileName(request.fileName);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const dirPath = path.join(this.localStoragePath, String(year), request.referenceNo);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, storedFileName);
        fs.writeFileSync(filePath, request.fileBuffer);

        return {
          status: 200,
          message: 'File uploaded successfully (local storage)',
          data: { filePath },
          success: true
        };
      } catch (error) {
        console.error('Local storage upload error:', error);
        return {
          status: 500,
          message: `Upload failed: ${error}`,
          error,
          success: false
        };
      }
    }

    try {
      // Create year/referenceNo directory structure for the booking
      const dirPath = `/${year}/${request.referenceNo}`;

      try {
        await client.ensureDir(dirPath);
      } catch (error) {
        console.error('Error creating directory:', error);
        return {
          status: 500,
          message: `Upload failed: could not create folder ${dirPath} on FTP server`,
          error,
          success: false
        };
      }

      // Upload file
      const filePath = `${dirPath}/${storedFileName}`;
      const tempFilePath = path.join(os.tmpdir(), storedFileName);

      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, request.fileBuffer);

      await client.uploadFrom(tempFilePath, filePath);

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        message: 'File uploaded successfully',
        data: { filePath: path.win32.join(FTP_ROOT_WINDOWS_PATH, String(year), request.referenceNo, storedFileName) },
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
    const year = await this.getBookingYear(referenceNo);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const dirPath = path.join(this.localStoragePath, String(year), referenceNo);

        if (!fs.existsSync(dirPath)) {
          return {
            status: 200,
            message: 'No files found',
            data: [],
            success: true
          };
        }

        const fileInfos: FileInfo[] = fs.readdirSync(dirPath).map((name) => {
          const stats = fs.statSync(path.join(dirPath, name));
          return {
            name,
            size: stats.size,
            modifiedAt: stats.mtime,
            path: `${year}/${referenceNo}/${name}`
          };
        });

        return {
          status: 200,
          message: 'Files retrieved successfully (local storage)',
          data: fileInfos,
          success: true
        };
      } catch (error) {
        console.error('Local storage list error:', error);
        return {
          status: 200,
          message: 'No files found',
          data: [],
          success: true
        };
      }
    }

    try {
      const dirPath = `/${year}/${referenceNo}`;

      await client.cd(dirPath);
      const files = await client.list();

      const fileInfos: FileInfo[] = files
        .filter((file) => file.type === ftp.FileType.File)
        .map((file) => ({
          name: file.name,
          size: file.size,
          modifiedAt: file.modifiedAt || new Date(),
          path: `${year}/${referenceNo}/${file.name}`
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
    const year = await this.getBookingYear(referenceNo);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(this.localStoragePath, String(year), referenceNo, fileName);

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
      const filePath = `/${year}/${referenceNo}/${fileName}`;
      const tempFilePath = path.join(os.tmpdir(), `download_${Date.now()}_${fileName}`);

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
    const year = await this.getBookingYear(referenceNo);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(this.localStoragePath, String(year), referenceNo, fileName);

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
      const filePath = `/${year}/${referenceNo}/${fileName}`;
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
