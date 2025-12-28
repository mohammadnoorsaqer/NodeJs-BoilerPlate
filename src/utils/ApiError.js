class ApiError extends Error {
  constructor(statusCode, message, message_ar = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.message_ar = message_ar;
    this.isOperational = isOperational;
    
    // Handle both stack traces and retryAfter (for rate limiting)
    if (stack) {
      // If stack is a number, it's actually retryAfter seconds
      if (typeof stack === 'number') {
        this.retryAfter = stack;
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = stack;
      }
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;