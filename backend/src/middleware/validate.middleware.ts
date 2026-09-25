// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../utils/api-response';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Middleware factory: validates request body/params/query against Zod schemas.
 * Replaces req.body/params/query with parsed (cleaned) values.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        // Express 5 exposes req.query as a getter only — plain assignment throws
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
        sendError(res, messages.join('; '), 422);
        return;
      }
      next(error);
    }
  };
}
