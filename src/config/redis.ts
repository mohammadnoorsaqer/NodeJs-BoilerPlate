import { createClient } from 'redis';
import logger from './logger';
import config from './config';

const client = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    connectTimeout: 60_000,
  },
  password: config.redis.password ?? undefined,
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis client connecting...'));
client.on('ready', () => logger.info('Redis client connected successfully'));
client.on('reconnecting', () => logger.info('Redis client reconnecting...'));

void (async () => {
  try {
    await client.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
  }
})();

export default client;
