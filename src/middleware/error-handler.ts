

import type { ErrorRequestHandler } from 'express';
import { config } from '../config/env';
import { AppError } from '../utils/app-error';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError ? error : new AppError('An unexpected error occurred.');
  if (!(error instanceof AppError)) console.error(error);
  res.status(appError.statusCode).json({
    error: config.nodeEnv === 'production' && appError.statusCode >= 500 ? 'Internal server error.' : appError.message,
    code: appError.code,
  });
};

