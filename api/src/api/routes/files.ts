import { FTPService } from '@/services/ftp';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { Container } from 'typedi';
import multer from 'multer';
import mime from 'mime';
import * as path from 'path';
import type { CarDocumentSection } from '@libs/types';

const route = Router();

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
// Extension is checked rather than MIME type: browsers/OSes report inconsistent
// or generic (e.g. application/octet-stream) MIME types for the same file type.
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
const CAR_UPLOAD_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const CAR_UPLOAD_SECTIONS: CarDocumentSection[] = ['RoadTax', 'Insurance', 'CarFitness'];
const START_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

const carUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (CAR_UPLOAD_ALLOWED_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: jpg, jpeg, png, pdf.'));
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

const handleCarUpload = (req: Request, res: Response, next: NextFunction) => {
  carUpload.single('file')(req, res, (error: unknown) => {
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

  // Upload a car document (Road Tax / Insurance / Fitness) to
  // /Dropbox/Cars/[CarId]/[Section]/[StartDate]/
  route.post('/car-upload', handleCarUpload, async (req: Request, res: Response) => {
    try {
      const carId = Number(req.body.carId);
      const section = req.body.section as string;
      const startDate = req.body.startDate as string;
      const file = req.file;

      if (!file || !carId || !section || !startDate) {
        return res.status(400).send({
          status: 400,
          message: 'carId, section, startDate, and file are required',
          success: false
        });
      }

      if (!CAR_UPLOAD_SECTIONS.includes(section as CarDocumentSection)) {
        return res.status(400).send({
          status: 400,
          message: `Invalid section "${section}". Must be one of: ${CAR_UPLOAD_SECTIONS.join(', ')}`,
          success: false
        });
      }

      if (!START_DATE_PATTERN.test(startDate)) {
        return res.status(400).send({
          status: 400,
          message: 'startDate must be formatted as YYYY-MM-DD',
          success: false
        });
      }

      const ftpService = Container.get(FTPService);
      const result = await ftpService.uploadCarFile({
        carId,
        section: section as CarDocumentSection,
        startDate,
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
        const contentType = mime.lookup(fileName, 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);
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
