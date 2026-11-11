import { Queue } from 'bullmq';
import { createClient } from 'redis';
import logger from './logger';
import config from './config';

export const isProduction = config.NODE_ENV === 'production';

export const bullmqConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password ?? undefined,
};

export const waitForRedis = async (): Promise<void> => {
  const passwordSegment = config.redis.password
    ? `:${config.redis.password}@`
    : '';
  const client = createClient({
    url: `redis://${passwordSegment}${config.redis.host}:${config.redis.port}`,
    socket: { connectTimeout: 5000 },
  });

  client.on('error', (err) => logger.warn('Redis not ready yet:', err.message));

  let connected = false;
  while (!connected) {
    try {
      await client.connect();
      connected = true;
      logger.info('Redis is ready for BullMQ');
      await client.disconnect();
    } catch {
      logger.warn('Waiting for Redis... retrying in 2s');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

export const notificationQueue = new Queue('notificationQueue', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
