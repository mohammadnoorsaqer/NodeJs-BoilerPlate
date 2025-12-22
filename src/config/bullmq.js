// bullmqQueue.js
const { Queue } = require('bullmq');
const logger = require('./logger');
const config = require('./config');
const Redis = require('redis');

const isProduction = config.NODE_ENV === 'production';

// BullMQ connection
const bullmqConnection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
};

// Optional wait-for-Redis helper
const waitForRedis = async () => {
  const client = Redis.createClient({
    url: `redis://:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}`,
    socket: { connectTimeout: 5000 },
  });

  client.on('error', (err) => logger.warn('Redis not ready yet:', err.message));

  let connected = false;
  while (!connected) {
    try {
      await client.connect();
      connected = true;
      logger.info('✅ Redis is ready for BullMQ');
      await client.disconnect();
    } catch (err) {
      logger.warn('Waiting for Redis... retrying in 2s');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

// Define the notification queue
const notificationQueue = new Queue('notificationQueue', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

module.exports = {
  notificationQueue,
  bullmqConnection,
  waitForRedis,
  isProduction,
};
