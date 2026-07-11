import { FTPService } from '@/services/ftp';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { Container } from 'typedi';
import multer from 'multer';
import * as path from 'path';

const route = Router();

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
// Extension is checked rather than MIME type: browsers/OSes report inconsistent
// or generic (e.g. application/octet-stream) MIME types for the same file type.
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images (jpg, png, gif, webp), PDF, and Word documents.'));
    }
  }
});

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (!error) {
      return next();
    }

    const message =
      error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 10MB.'
        : (error as Error).message || 'File upload error';

    res.status(400).send({
      status: 400,
      message,
      success: false
    });
  });
};

export default (app: Router) => {
  app.use('/files', route);

  // Upload file
  route.post('/upload', handleUpload, async (req: Request, res: Response) => {
    try {
      const referenceNo = req.body.referenceNo as string;
      const file = req.file;

      if (!file || !referenceNo) {
        return res.status(400).send({
          status: 400,
          message: 'File and referenceNo are required',
          success: false
        });
      }

      const ftpService = Container.get(FTPService);
      const result = await ftpService.uploadFile({
        referenceNo,
        fileName: file.originalname,
        fileBuffer: file.buffer
      });

      res.status(result.status).send(result);
    } catch (error) {
      res.status(500).send({
        status: 500,
        message: `Upload failed: ${error}`,
        success: false
      });
    }
  });

  // List files for a booking
  route.get('/:referenceNo', async (req: Request, res: Response) => {
    try {
      const referenceNo = req.params.referenceNo;
      const ftpService = Container.get(FTPService);
      const result = await ftpService.listFiles(referenceNo);

      res.status(result.status).send(result);
    } catch (error) {
      res.status(500).send({
        status: 500,
        message: `Failed to list files: ${error}`,
        success: false
      });
    }
  });

  // Download file
  route.get('/:referenceNo/:fileName', async (req: Request, res: Response) => {
    try {
      const { referenceNo, fileName } = req.params;
      const ftpService = Container.get(FTPService);
      const result = await ftpService.downloadFile(referenceNo, fileName);

      if (result.success && result.data) {
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(result.data);
      } else {
        res.status(result.status).send({
          status: result.status,
          message: result.message,
          success: false
        });
      }
    } catch (error) {
      res.status(500).send({
        status: 500,
        message: `Download failed: ${error}`,
        success: false
      });
    }
  });

  // Delete file
  route.delete('/:referenceNo/:fileName', async (req: Request, res: Response) => {
    try {
      const { referenceNo, fileName } = req.params;
      const ftpService = Container.get(FTPService);
      const result = await ftpService.deleteFile(referenceNo, fileName);

      res.status(result.status).send(result);
    } catch (error) {
      res.status(500).send({
        status: 500,
        message: `Delete failed: ${error}`,
        success: false
      });
    }
  });
};
