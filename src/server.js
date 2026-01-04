// server.js
const http = require('http');
const express = require('express');
const cluster = require('cluster');
const os = require('os');

const config = require('./config/config');
const loader = require('./loaders');
const logger = require('./config/logger');

const isProduction = process.env.NODE_ENV === 'production';
const numCPUs = os.cpus().length;

/* -------------------- MASTER (PROD ONLY) -------------------- */
if (isProduction && cluster.isMaster) {
  logger.info(`Master process ${process.pid} running (PRODUCTION)`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    logger.error(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  return; // ⛔ master exits here
}

/* -------------------- WORKER or DEV -------------------- */
const redisClient = require('./config/redis');
const { closePool } = require('./config/postgres');

const exitHandler = (server) => {
  if (!server) process.exit(1);

  server.close(async () => {
    logger.info(`Process ${process.pid} shutting down`);

    try {
      await Promise.all([
        redisClient.quit(),
        closePool(),
      ]);
      logger.info('DB connections closed');
    } catch (err) {
      logger.error('Error closing DB connections', err);
    }

    process.exit(0);
  });
};

const unexpectedErrorHandler = (server) => (error) => {
  logger.error('Unexpected error:', error);
  exitHandler(server);
};

const startServer = async () => {
  const app = express();
  await loader(app);

  const server = http.createServer(app).listen(config.PORT, () => {
    logger.info(
      `${isProduction ? 'Worker' : 'Dev server'} ${process.pid} listening on port ${config.PORT}`
    );
  });

  process.on('uncaughtException', unexpectedErrorHandler(server));
  process.on('unhandledRejection', unexpectedErrorHandler(server));

  process.on('SIGTERM', () => exitHandler(server));
  process.on('SIGINT', () => exitHandler(server));
};

startServer();
