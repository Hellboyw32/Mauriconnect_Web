# FTP File Upload Implementation

## Overview

This implementation adds FTP file upload/download functionality to the booking system. Files are organized by booking reference number in separate folders on the FTP server.

## Features

- ✅ Upload multiple files to FTP server
- ✅ Files organized by booking reference number (`/bookings/{referenceNo}/`)
- ✅ Display uploaded files with thumbnails
- ✅ Download files from FTP server
- ✅ Delete files from FTP server
- ✅ Image preview with thumbnails
- ✅ File metadata display (size, date)

## Installation

### 1. Install Backend Dependencies

```bash
cd api
npm install basic-ftp multer
npm install --save-dev @types/multer
```

### 2. Configure FTP Settings

Add the following to your `api/.env` file:

```env
FTP_HOST=your_ftp_host
FTP_PORT=21
FTP_USER=your_ftp_username
FTP_PASSWORD=your_ftp_password
FTP_SECURE=false
```

Set `FTP_SECURE=true` for FTPS (FTP over SSL/TLS).

## API Endpoints

### Upload File

```
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File (binary)
- referenceNo: string
```

### List Files

```
GET /api/files/:referenceNo
```

### Download File

```
GET /api/files/:referenceNo/:fileName
```

### Delete File

```
DELETE /api/files/:referenceNo/:fileName
```

## Usage

### In Booking Details Page

```tsx
import { BookingDocuments } from 'src/sections/booking/documents/booking-documents';

// In your component
<BookingDocuments referenceNo={booking.ReferenceNo} />;
```

### Standalone File Uploader

```tsx
import { FileUploader } from 'src/sections/booking/documents/file-uploader';

const [uploaderOpen, setUploaderOpen] = useState(false);

<FileUploader
  referenceNo="REF123"
  open={uploaderOpen}
  onClose={() => setUploaderOpen(false)}
  onUploadComplete={() => {
    // Refresh file list or perform action after upload
  }}
/>;
```

### File List Only

```tsx
import { FileList } from 'src/sections/booking/documents/file-list';

<FileList referenceNo="REF123" />;
```

## File Structure

### Backend

- `api/src/services/ftp.ts` - FTP service with upload/download/delete methods
- `api/src/api/routes/files.ts` - API routes for file operations

### Frontend

- `client/src/api/files/index.ts` - Client API wrapper
- `client/src/sections/booking/documents/file-uploader.tsx` - Upload dialog
- `client/src/sections/booking/documents/file-list.tsx` - File display with thumbnails
- `client/src/sections/booking/documents/booking-documents.tsx` - Combined component

## FTP Directory Structure

```
/bookings/
  ├── REF001/
  │   ├── document1.pdf
  │   ├── photo1.jpg
  │   └── contract.docx
  ├── REF002/
  │   └── invoice.pdf
  └── ...
```

## Supported File Types

- Images: jpg, jpeg, png, gif, bmp, webp, svg (with thumbnail preview)
- Documents: pdf, doc, docx, txt, rtf
- Spreadsheets: xls, xlsx, csv
- All other file types supported (generic icon)

## Security Notes

- Store FTP credentials in environment variables
- Use FTPS (secure FTP) in production
- Implement file size limits (currently 3MB in FileDropzone caption)
- Consider adding file type validation
- Add authentication to API endpoints in production

## Troubleshooting

### Connection Issues

- Verify FTP host, port, username, and password
- Check firewall settings
- Ensure FTP server allows passive mode

### Upload Failures

- Check file size limits
- Verify FTP user has write permissions
- Check disk space on FTP server

### Download Issues

- Verify file exists on FTP server
- Check FTP user has read permissions
- Browser may block downloads - check console
