// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError' || err.name === 'BSONError') {
    // Malformed ObjectId / date / number in a path or body
    status = 400;
    message = err.name === 'CastError' && err.path ? `Invalid value for ${err.path}` : 'Invalid id';
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 422;
    message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join('; ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with the same unique value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(err);
    // Never leak internal error details to clients in production
    if (process.env.NODE_ENV === 'production') message = 'Internal Server Error';
  }

  res.status(status).json({ success: false, error: message, message });
};
