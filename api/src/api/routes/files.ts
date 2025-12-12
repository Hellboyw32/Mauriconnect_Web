import { FTPService } from '@/services/ftp';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
import multer from 'multer';

const route = Router();
const upload = multer({ storage: multer.memoryStorage() });

export default (app: Router) => {
  app.use('/files', route);

  // Upload file
  route.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
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
