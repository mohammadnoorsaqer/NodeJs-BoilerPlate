const appLoader = require('./app');
const logger = require('../config/logger');
module.exports = async (app) => {
  await appLoader(app);
  logger.info('Loaded app');
};
