const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status").default;
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (err.name === "SequelizeValidationError") {
    error = new ApiError(
      httpStatus.BAD_REQUEST,
      err.errors.map((e) => e.message).join(", "),
      "",
      err.stack
    );
  }

  // ✅ Sequelize unique constraint error
  else if (err.name === "SequelizeUniqueConstraintError") {
    error = new ApiError(
      httpStatus.BAD_REQUEST,
      err.errors.map((e) => e.message).join(", "),
      "",
      err.stack
    );
  } else if (err.isJoi) {
    error = new ApiError(httpStatus.BAD_REQUEST, null, true, err.stack);
  }

  // ❗ Convert unknown errors LAST
  else if (!(err instanceof ApiError)) {
    const statusCode =
      err.statusCode && Number.isInteger(err.statusCode)
        ? err.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR;

    const message =
      err.message || httpStatus[statusCode] || "Internal Server Error";

    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message, message_ar, stack } = err;

  if (!statusCode || isNaN(statusCode)) {
    statusCode = 500;
  }

  if (config.env === "production" && !err.isOperational) {
    statusCode = 500;
    message = "Internal Server Error";
    message_ar = "خطأ في الخادم الداخلي";
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(message_ar && { message_ar }),
    ...(config.env === "development" && { stack: err.stack }),
    stack,
  };

  if (config.env === "development") {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
