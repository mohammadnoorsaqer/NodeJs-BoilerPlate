import winston from 'winston';

const { format, createLogger, transports } = winston;
const { printf, combine, timestamp, colorize, uncolorize } = format;

const winstonFormat = printf(({ timestamp: ts, level, message, label }) => {
  return `${ts} [${level}] ${message}${label ? `: ${label}` : ''}`;
});

const getLogger = (env: string | undefined) => {
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

const logger = getLogger(process.env.NODE_ENV);

export default logger;
