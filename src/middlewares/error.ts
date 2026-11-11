import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { ValidationErrorItem } from 'sequelize';
import config from '../config/config';
import logger from '../config/logger';
import { ApiError } from '../utils/ApiError';

interface SequelizeValidationError extends Error {
  name: 'SequelizeValidationError' | 'SequelizeUniqueConstraintError';
  errors: ValidationErrorItem[];
}

const isSequelizeValidationError = (
  err: unknown,
): err is SequelizeValidationError =>
  typeof err === 'object' &&
  err !== null &&
  'name' in err &&
  (err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError') &&
  'errors' in err &&
  Array.isArray((err as SequelizeValidationError).errors);

export const errorConverter = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  let error: ApiError;

  if (isSequelizeValidationError(err)) {
    error = new ApiError(
      httpStatus.BAD_REQUEST,
      err.errors.map((e) => e.message).join(', '),
      '',
      true,
      err.stack,
    );
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'isJoi' in err &&
    (err as { isJoi?: boolean }).isJoi
  ) {
    const joiErr = err as unknown as Error;
    error = new ApiError(
      httpStatus.BAD_REQUEST,
      joiErr.message,
      null,
      true,
      joiErr.stack,
    );
  } else if (!(err instanceof ApiError)) {
    const maybeErr = err as { statusCode?: number; message?: string; stack?: string };
    const statusCode =
      maybeErr.statusCode && Number.isInteger(maybeErr.statusCode)
        ? maybeErr.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR;

    const message =
      maybeErr.message ||
      (httpStatus[statusCode as keyof typeof httpStatus] as string) ||
      'Internal Server Error';

    error = new ApiError(statusCode, message, null, false, maybeErr.stack);
  } else {
    error = err;
  }

  next(error);
};

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let { statusCode, message, message_ar, stack, retryAfter } = err;

  if (!statusCode || Number.isNaN(statusCode)) {
    statusCode = 500;
  }

  if (config.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
    message_ar = 'خطأ في الخادم الداخلي';
  }

  res.locals.errorMessage = err.message;

  const response: Record<string, unknown> = {
    code: statusCode,
    message,
    ...(message_ar && { message_ar }),
  };

  if (retryAfter) {
    res.set('Retry-After', String(retryAfter));
    response.retryAfter = retryAfter;
  }

  if (config.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }

  if (config.NODE_ENV === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
