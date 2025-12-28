const winston = require('winston');
const { format, createLogger, transports } = winston;
const { printf, combine, timestamp, colorize, uncolorize } = format;

// Custom log format
const winstonFormat = printf(({ timestamp, level, message, label }) => {
  return `${timestamp} [${level}] ${message}${label ? `: ${label}` : ''}`;
});

// Lazy function to create logger
const getLogger = (env) => {
  const level = env === 'development' ? 'debug' : 'info';
  return createLogger({
    level,
    format: combine(
      timestamp(),
      env === 'development' ? colorize() : uncolorize(),
      winstonFormat,
    ),
    transports: [new transports.Console()],
  });
};

// Export a logger instance with current NODE_ENV
const logger = getLogger(process.env.NODE_ENV);

module.exports = logger;
