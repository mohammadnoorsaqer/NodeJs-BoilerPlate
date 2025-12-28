// config/morgan.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('./config');

// Optional file logging
const logFilePath = path.join(__dirname, '..', 'logs/access.log');
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Normalize IP (::1 => 127.0.0.1)
morgan.token('ip', (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  return ip === '::1' ? '127.0.0.1' : ip;
});

// Optional message from res.locals.errorMessage
morgan.token('message', (_req, res) => res.locals.errorMessage || '');

// Format strings
const getIpFormat = () => (config.NODE_ENV === 'production' ? ':ip - ' : '');
const successFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

// Success logger (status < 400)
const successHandler = morgan(successFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: {
    write: (message) => {
      logger.info(message.trim());
      accessLogStream.write(message + '\n'); // optional file logging
    },
  },
});

// Error logger (status >= 400)
const errorHandler = morgan(errorFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      logger.error(message.trim());
      accessLogStream.write(message + '\n'); // optional file logging
    },
  },
});

module.exports = {
  successHandler,
  errorHandler,
};
