export class ApiError extends Error {
  readonly statusCode: number;
  readonly message_ar: string | null;
  readonly isOperational: boolean;
  readonly retryAfter?: number;

  constructor(
    statusCode: number,
    message: string,
    message_ar: string | null = null,
    isOperational = true,
    stackOrRetryAfter: string | number = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.message_ar = message_ar;
    this.isOperational = isOperational;

    if (typeof stackOrRetryAfter === 'number') {
      this.retryAfter = stackOrRetryAfter;
      Error.captureStackTrace(this, this.constructor);
    } else if (stackOrRetryAfter) {
      this.stack = stackOrRetryAfter;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
