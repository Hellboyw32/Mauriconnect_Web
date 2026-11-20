import { Inject, Service } from 'typedi';
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Response } from '@/types';
import type { CarDocumentSection } from '@libs/types';
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

export interface UploadCarFileRequest {
  carNumber: string;
  section: CarDocumentSection;
  startDate: string;
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
const CAR_UPLOAD_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Windows path of the upload folder on the FTP server, used only to build a
// human-readable full path for storage in the database - not used for FTP transfers.
const FTP_ROOT_WINDOWS_PATH =
  process.env.FTP_ROOT_WINDOWS_PATH || 'C:\\inetpub\\MauriconnectFileUpload';

const FALLBACK_RETRY_INTERVAL_MS = 60 * 1000;

@Service()
export class FTPService {
  private config: FTPConfig;
  private useFallback: boolean = false;
  private fallbackSince: number = 0;
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
      secure: process.env.FTP_SECURE === 'true' // Force non-secure connection first
    };

    // Create local storage directory if it doesn't exist
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  private async getClient(): Promise<ftp.Client | null> {
    if (this.useFallback) {
      if (Date.now() - this.fallbackSince < FALLBACK_RETRY_INTERVAL_MS) {
        console.log('Using local file storage fallback');
        return null;
      }
      // Retry interval elapsed - give the FTP server another chance
      console.log('Fallback retry interval elapsed, retrying FTP connection');
    }

    // Client.ftp.timeout is read-only in current @types/basic-ftp - the
    // 30s timeout has to be passed through the constructor instead (it's
    // also already the library default, so this is just being explicit).
    const client = new ftp.Client(30000);
    client.ftp.verbose = process.env.NODE_ENV === 'development';

    try {
      console.log('Attempting FTP connection to:', this.config.host);
      console.log('Using username:', this.config.user);

      await client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
        secureOptions: {
          rejectUnauthorized: false
        }
      });

      console.log('FTP connection successful');
      this.useFallback = false;
      return client;
    } catch (error) {
      const err = error as { message?: string; code?: string };
      console.error('FTP connection error:', err.message || err, err.code ? `(code: ${err.code})` : '');
      console.error('FTP Config (password hidden):', {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        secure: this.config.secure
      });
      console.warn('Falling back to local file storage');
      this.useFallback = true;
      this.fallbackSince = Date.now();
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

  // Car numbers are free-text (e.g. "2134 FB 23") and used directly as a
  // folder name, so strip characters that are invalid in Windows/FTP paths.
  // Spaces are kept - they're common in plate numbers and harmless in paths.
  private sanitizeCarFolderSegment(carNumber: string): string {
    return carNumber.trim().replace(/[\\/:*?"<>|]/g, '_');
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

  // Car documents (Road Tax / Insurance / Fitness) only accept the narrower
  // image + PDF set, unlike booking uploads which also allow Word docs.
  static validateCarFile(fileName: string, fileSizeBytes: number): string | null {
    const extension = path.extname(fileName).toLowerCase();

    if (!CAR_UPLOAD_ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type "${extension || 'unknown'}" is not allowed. Allowed types: jpg, jpeg, png, pdf.`;
    }

    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  }

  // Uploads a car document under /Dropbox/Cars/[CarNumber]/[Section]/[StartDate]/,
  // keeping the original file name (unlike uploadFile, which timestamp-prefixes
  // booking documents). ensureDir creates every missing folder in the path in
  // order, satisfying the required Dropbox/Cars/.../[Section]/[StartDate]/
  // creation sequence without needing to call it once per level.
  async uploadCarFile(request: UploadCarFileRequest): Promise<Response<{ filePath: string }>> {
    const validationError = FTPService.validateCarFile(
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

    const fileName = path.basename(request.fileName).trim();
    const carFolder = this.sanitizeCarFolderSegment(request.carNumber);
    const dirPath = `/Dropbox/Cars/${carFolder}/${request.section}/${request.startDate}`;
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const dirFsPath = path.join(
          this.localStoragePath,
          'Dropbox',
          'Cars',
          carFolder,
          request.section,
          request.startDate
        );
        if (!fs.existsSync(dirFsPath)) {
          fs.mkdirSync(dirFsPath, { recursive: true });
        }

        const filePath = path.join(dirFsPath, fileName);
        fs.writeFileSync(filePath, request.fileBuffer);

        return {
          status: 200,
          message: 'File uploaded successfully (local storage)',
          data: { filePath },
          success: true
        };
      } catch (error) {
        console.error('Local storage car upload error:', error);
        return {
          status: 500,
          message: `Upload failed: ${error}`,
          error,
          success: false
        };
      }
    }

    try {
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

      const filePath = `${dirPath}/${fileName}`;
      const tempFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);

      fs.writeFileSync(tempFilePath, request.fileBuffer);
      await client.uploadFrom(tempFilePath, filePath);
      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        message: 'File uploaded successfully',
        data: { filePath },
        success: true
      };
    } catch (error) {
      console.error('FTP car upload error:', error);
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

    // Reference numbers can carry stray leading/trailing whitespace from data
    // entry; left untrimmed, the folder name built from it gets rejected by
    // Windows-backed FTP servers ("550 Invalid file name or path").
    const referenceNo = request.referenceNo.trim();
    const year = await this.getBookingYear(referenceNo);
    const storedFileName = this.buildStoredFileName(request.fileName);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const dirPath = path.join(this.localStoragePath, String(year), referenceNo);
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
      const dirPath = `/${year}/${referenceNo}`;

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
      const tempFileSize = fs.statSync(tempFilePath).size;
      console.log(`Uploading ${storedFileName}: source buffer ${request.fileBuffer.length} bytes, temp file ${tempFileSize} bytes`);

      await client.uploadFrom(tempFilePath, filePath);

      const remoteSize = await client.size(filePath).catch((error) => {
        console.error('Could not verify remote file size after upload:', error);
        return -1;
      });

      if (remoteSize !== tempFileSize) {
        console.warn(`FTP upload size mismatch for ${filePath}: local ${tempFileSize} bytes, remote reports ${remoteSize} bytes`);
      } else {
        console.log(`FTP upload verified for ${filePath}: ${remoteSize} bytes`);
      }

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        message: 'File uploaded successfully',
        data: { filePath: path.win32.join(FTP_ROOT_WINDOWS_PATH, String(year), referenceNo, storedFileName) },
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

  async listCarFiles(
    carNumber: string,
    section: CarDocumentSection,
    startDate: string
  ): Promise<Response<FileInfo[]>> {
    const carFolder = this.sanitizeCarFolderSegment(carNumber);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const dirFsPath = path.join(
          this.localStoragePath,
          'Dropbox',
          'Cars',
          carFolder,
          section,
          startDate
        );

        if (!fs.existsSync(dirFsPath)) {
          return {
            status: 200,
            message: 'No files found',
            data: [],
            success: true
          };
        }

        const fileInfos: FileInfo[] = fs.readdirSync(dirFsPath).map((name) => {
          const stats = fs.statSync(path.join(dirFsPath, name));
          return {
            name,
            size: stats.size,
            modifiedAt: stats.mtime,
            path: `Dropbox/Cars/${carFolder}/${section}/${startDate}/${name}`
          };
        });

        return {
          status: 200,
          message: 'Files retrieved successfully (local storage)',
          data: fileInfos,
          success: true
        };
      } catch (error) {
        console.error('Local storage car list error:', error);
        return {
          status: 200,
          message: 'No files found',
          data: [],
          success: true
        };
      }
    }

    try {
      const dirPath = `/Dropbox/Cars/${carFolder}/${section}/${startDate}`;

      await client.cd(dirPath);
      const files = await client.list();

      const fileInfos: FileInfo[] = files
        .filter((file) => file.type === ftp.FileType.File)
        .map((file) => ({
          name: file.name,
          size: file.size,
          modifiedAt: file.modifiedAt || new Date(),
          path: `Dropbox/Cars/${carFolder}/${section}/${startDate}/${file.name}`
        }));

      return {
        status: 200,
        message: 'Files retrieved successfully',
        data: fileInfos,
        success: true
      };
    } catch (error) {
      console.error('FTP car list error:', error);
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

  async downloadCarFile(
    carNumber: string,
    section: CarDocumentSection,
    startDate: string,
    fileName: string
  ): Promise<Response<Buffer>> {
    const carFolder = this.sanitizeCarFolderSegment(carNumber);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(
          this.localStoragePath,
          'Dropbox',
          'Cars',
          carFolder,
          section,
          startDate,
          fileName
        );

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
        console.error('Local storage car download error:', error);
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
      const filePath = `/Dropbox/Cars/${carFolder}/${section}/${startDate}/${fileName}`;
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
      console.error('FTP car download error:', error);
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

  async deleteCarFile(
    carNumber: string,
    section: CarDocumentSection,
    startDate: string,
    fileName: string
  ): Promise<Response<void>> {
    const carFolder = this.sanitizeCarFolderSegment(carNumber);
    const client = await this.getClient();

    // Use local file storage if FTP is unavailable
    if (!client) {
      try {
        const filePath = path.join(
          this.localStoragePath,
          'Dropbox',
          'Cars',
          carFolder,
          section,
          startDate,
          fileName
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return {
          status: 200,
          message: 'File deleted successfully (local storage)',
          success: true
        };
      } catch (error) {
        console.error('Local storage car delete error:', error);
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
      const filePath = `/Dropbox/Cars/${carFolder}/${section}/${startDate}/${fileName}`;
      await client.remove(filePath);

      return {
        status: 200,
        message: 'File deleted successfully',
        success: true
      };
    } catch (error) {
      console.error('FTP car delete error:', error);
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

  // ---- Expense supporting documents: /Dropbox/Expenses/[ExpenseId]/[StoredFileName] ----
  // Indexed by the ExpenseAttachments table, so callers pass the unique stored
  // name (never a user-supplied path) and no listing method is needed. Files are
  // never removed from storage - removing a document only soft-deletes its row,
  // so historical records stay auditable.

  private expenseDir(expenseId: number): { ftpDir: string; fsDir: string } {
    return {
      ftpDir: `/Dropbox/Expenses/${expenseId}`,
      fsDir: path.join(this.localStoragePath, 'Dropbox', 'Expenses', String(expenseId))
    };
  }

  async uploadExpenseFile(
    expenseId: number,
    storedFileName: string,
    fileBuffer: Buffer
  ): Promise<Response<{ filePath: string }>> {
    const { ftpDir, fsDir } = this.expenseDir(expenseId);
    const client = await this.getClient();

    if (!client) {
      try {
        fs.mkdirSync(fsDir, { recursive: true });
        const filePath = path.join(fsDir, storedFileName);
        fs.writeFileSync(filePath, fileBuffer);
        return { status: 200, message: 'File uploaded (local storage)', data: { filePath }, success: true };
      } catch (error) {
        return { status: 500, message: `Upload failed: ${error}`, error, success: false };
      }
    }

    try {
      await client.ensureDir(ftpDir);
      const filePath = `${ftpDir}/${storedFileName}`;
      const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${storedFileName}`);

      fs.writeFileSync(tempFilePath, fileBuffer);
      try {
        await client.uploadFrom(tempFilePath, filePath);
      } finally {
        fs.unlinkSync(tempFilePath);
      }

      return { status: 200, message: 'File uploaded successfully', data: { filePath }, success: true };
    } catch (error) {
      console.error('FTP expense upload error:', error);
      return { status: 500, message: `Upload failed: ${error}`, error, success: false };
    } finally {
      client.close();
    }
  }

  async downloadExpenseFile(expenseId: number, storedFileName: string): Promise<Response<Buffer>> {
    const { ftpDir, fsDir } = this.expenseDir(expenseId);
    const client = await this.getClient();

    if (!client) {
      try {
        const filePath = path.join(fsDir, storedFileName);
        if (!fs.existsSync(filePath)) {
          return { status: 404, message: 'File not found', error: new Error('File not found'), success: false };
        }
        return { status: 200, message: 'File downloaded (local storage)', data: fs.readFileSync(filePath), success: true };
      } catch (error) {
        return { status: 500, message: `Download failed: ${error}`, error, success: false };
      }
    }

    try {
      const tempFilePath = path.join(os.tmpdir(), `download_${Date.now()}_${storedFileName}`);
      await client.downloadTo(tempFilePath, `${ftpDir}/${storedFileName}`);
      const fileBuffer = fs.readFileSync(tempFilePath);
      fs.unlinkSync(tempFilePath);

      return { status: 200, message: 'File downloaded successfully', data: fileBuffer, success: true };
    } catch (error) {
      console.error('FTP expense download error:', error);
      return { status: 500, message: `Download failed: ${error}`, error, success: false };
    } finally {
      client.close();
    }
  }

  async listFiles(referenceNo: string): Promise<Response<FileInfo[]>> {
    referenceNo = referenceNo.trim();
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
    referenceNo = referenceNo.trim();
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
    referenceNo = referenceNo.trim();
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
