import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { syllabusController } from '../controllers/syllabus.controller';

const router = Router();

// Configure multer memory storage with 10MB limit and PDF validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';
    const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      const err: any = new Error('Only PDF files (.pdf) are permitted');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  }
});

// Middleware to catch multer-specific errors (e.g. file size exceeded)
function handleMulterUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single('syllabus')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'Syllabus PDF file size exceeds the 10MB maximum limit' }
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: { code: err.code || 'UPLOAD_ERROR', message: err.message || 'File upload failed' }
      });
      return;
    }
    next();
  });
}

// POST /api/syllabus/upload
router.post(
  '/upload',
  authenticate,
  handleMulterUpload,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    syllabusController.uploadAndParseSyllabus(req, res, next);
  }
);

export default router;
