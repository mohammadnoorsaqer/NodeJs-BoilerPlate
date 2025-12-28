// config/postgres.js
const { Pool } = require('pg');
const config = require('./config');
const logger = require('./logger');

// Create a singleton pool instance
const pool = new Pool(config.sqlDB);

let isConnected = false;

// Only log once when pool is ready
pool.on('connect', () => {
  if (!isConnected) {
    logger.info('PostgreSQL connected successfully');
    isConnected = true;
  }
});

pool.on('error', (err) => {
  logger.error('PostgreSQL error', err);
  process.exit(1);
});

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed');
  } catch (err) {
    logger.error('Error closing PostgreSQL pool', err);
  }
};

module.exports = pool;
module.exports.closePool = closePool;