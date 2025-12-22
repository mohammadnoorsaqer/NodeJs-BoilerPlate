const http = require("http");
const config = require("./config/config");
const app = require("./app");
const logger = require("./config/logger");

const httpServer = http.createServer(app);
const server = httpServer.listen(config.PORT, () => {
  logger.info(`server listening on port ${config.PORT}`);
});
require('./config/redis');
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unExpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};


process.on("uncaughtException", unExpectedErrorHandler);
process.on("unhandledRejection", unExpectedErrorHandler);
process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
