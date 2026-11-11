import http from 'http';
import express from 'express';
import cluster from 'cluster';
import os from 'node:os';
import config from './config/config';
import load from './loaders';
import logger from './config/logger';
import redisClient from './config/redis';
import { closePool } from './config/postgres';

const numCPUs =
  typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;

const exitHandler = (server: http.Server | null): void => {
  if (!server) {
    process.exit(1);
    return;
  }

  server.close(async () => {
    logger.info(`Process ${process.pid} shutting down`);

    try {
      await Promise.all([redisClient.quit(), closePool()]);
      logger.info('DB connections closed');
    } catch (err) {
      logger.error('Error closing DB connections', err);
    }

    process.exit(0);
  });
};

const unexpectedErrorHandler =
  (server: http.Server | null) =>
  (error: unknown): void => {
    logger.error('Unexpected error:', error);
    exitHandler(server);
  };

const startApp = async (): Promise<http.Server> => {
  const app = express();
  await load(app);

  const server = http.createServer(app).listen(config.PORT, () => {
    logger.info(`Server ${process.pid} listening on port ${config.PORT}`);
  });

  process.on('uncaughtException', unexpectedErrorHandler(server));
  process.on('unhandledRejection', unexpectedErrorHandler(server));
  process.on('SIGTERM', () => exitHandler(server));
  process.on('SIGINT', () => exitHandler(server));

  return server;
};

const startServer = async (): Promise<void> => {
  if (cluster.isPrimary && config.NODE_ENV === 'production') {
    for (let i = 0; i < numCPUs; i++) cluster.fork();

    cluster.on('exit', (worker) => {
      logger.error(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    await startApp();
  }
};

void startServer();
