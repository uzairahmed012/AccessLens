import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './errors.js';

// Parse into res.locals; future controllers must use validated data, not req.body.
export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Request body is invalid.'));
      return;
    }
    res.locals.body = result.data;
    next();
  };
}
