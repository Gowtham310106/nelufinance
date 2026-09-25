// src/features/adaku/adaku.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { adakuController } from './adaku.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { validate } from '../../middleware/validate.middleware';
import { sendError } from '../../utils/api-response';
import { createAdakuPaymentSchema } from './adaku.validators';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
} from '../upload/upload.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_UPLOAD_BYTES,
    files: 5, // Up to 5 photos
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(Object.assign(new Error(`Unsupported file type: ${file.mimetype}. Please upload JPEG, PNG or WebP photos.`), { status: 400 }));
  },
});

/** Runs multer and turns its errors (too large, too many files, bad type) into 400s. */
function uploadImages(req: Request, res: Response, next: NextFunction): void {
  upload.array('images', 5)(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `Each photo must be ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB or smaller`
          : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
            ? 'Up to 5 photos can be uploaded in the "images" field'
            : err.message;
      sendError(res, message, 400);
      return;
    }
    const status = (err as any).status;
    if (status) {
      sendError(res, (err as Error).message, status);
      return;
    }
    next(err);
  });
}

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/summary', adakuController.getSummary.bind(adakuController));
router.get('/', adakuController.getAll.bind(adakuController));
router.get('/:id', adakuController.getById.bind(adakuController));
router.get('/:id/vatti', adakuController.calculateInterest.bind(adakuController));

// Body is validated inside the controller (after multipart coercion) before any image is uploaded
router.post('/', uploadImages, adakuController.create.bind(adakuController));

router.post(
  '/:id/payments',
  validate({ body: createAdakuPaymentSchema }),
  adakuController.recordPayment.bind(adakuController)
);

export default router;
