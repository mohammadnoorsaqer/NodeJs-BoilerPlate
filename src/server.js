// server.js (or index.js)
const http = require('http');
const express = require('express');  // <-- add this
const config = require('./config/config');
const loader = require('./loaders'); // your loader index.js
const logger = require('./config/logger');
const redisClient = require('./config/redis');
const { closePool } = require('./config/postgres');

const exitHandler = (server) => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');

      try {
        await Promise.all([redisClient.quit(), closePool()]);
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Error closing database connections', error);
      }

      process.exit(0);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (server) => (error) => {
  logger.error('Unexpected error:', error);
  exitHandler(server);
};

const startServer = async () => {
  const app = express();  // <-- create Express app instance
  await loader(app);      // pass it to your loaders

  const httpServer = http.createServer(app);
  const server = httpServer.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`);
  });

  process.on('uncaughtException', unexpectedErrorHandler(server));
  process.on('unhandledRejection', unexpectedErrorHandler(server));

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) server.close();
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received (Ctrl+C)');
    if (server) server.close();
  });
};

startServer();
