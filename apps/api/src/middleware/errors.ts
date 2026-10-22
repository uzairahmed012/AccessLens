import type { ErrorRequestHandler } from 'express';
import type { ApiErrorCode, ApiErrorResponse } from '@accesslens/shared';
import type { Logger } from 'pino';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, _next) => {
    if (res.headersSent) {
      _next(error);
      return;
    }
    let safeError =
      error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    if (error instanceof SyntaxError && 'body' in error) {
      safeError = new AppError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.');
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      error.type === 'entity.too.large'
    ) {
      safeError = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the allowed size.');
    }
    // Raw errors can contain connection strings or submitted URLs. Log safe fields only.
    if (safeError.statusCode >= 500)
      logger.error({ requestId: req.id, code: safeError.code }, 'Request failed');
    const body: ApiErrorResponse = {
      error: { code: safeError.code, message: safeError.message, requestId: String(req.id) },
    };
    res.status(safeError.statusCode).json(body);
  };
}
