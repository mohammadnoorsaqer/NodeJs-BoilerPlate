const redis = require('redis');
const logger = require('./logger');
const config = require('./config');

const client = redis.createClient({
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    connectTimeout: 60000,
  },
  password: config.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis client connecting...'));
client.on('ready', () => logger.info('Redis client connected successfully'));
client.on('reconnecting', () => logger.info('Redis client reconnecting...'));

(async () => {
  try {
    await client.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
  }
})();

module.exports = client;
