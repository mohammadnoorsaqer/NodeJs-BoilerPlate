import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import logger from './logger';
import config from './config';

const logFilePath = path.join(__dirname, '..', 'logs/access.log');
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });

morgan.token('ip', (req) => {
  const request = req as Request;
  const ip = request.ip || request.socket.remoteAddress;
  return ip === '::1' ? '127.0.0.1' : (ip ?? '');
});

morgan.token('message', (_req, res) => {
  const response = res as Response;
  return (response.locals.errorMessage as string) || '';
});

const getIpFormat = () => (config.NODE_ENV === 'production' ? ':ip - ' : '');
const successFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

export const successHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
      accessLogStream.write(`${message}\n`);
    },
  },
});

export const errorHandler = morgan(errorFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: {
    write: (message: string) => {
      logger.error(message.trim());
      accessLogStream.write(`${message}\n`);
    },
  },
});
