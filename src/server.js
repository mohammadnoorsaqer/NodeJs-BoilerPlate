const http = require('http');
const config = require('./config/config');
const app = require('./app');
const logger = require('./config/logger');
const redisClient = require('./config/redis');
const { closePool } = require('./config/postgres');

const httpServer = http.createServer(app);

const server = httpServer.listen(config.PORT, () => {
  logger.info(`Server listening on port ${config.PORT}`);
});

const exitHandler = async () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');

      // Close database connections gracefully
      try {
        await Promise.all([redisClient.quit(), closePool()]);
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Error closing database connections', error);
      }

      process.exit(0); // Exit with success code after graceful shutdown
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  exitHandler();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received (Ctrl+C)');
  exitHandler();
});
