import { Pool } from 'pg';
import config from './config';
import logger from './logger';

const pool = new Pool(config.sqlDB);

let isConnected = false;

pool.on('connect', () => {
  if (!isConnected) {
    logger.info('PostgreSQL connected successfully');
    isConnected = true;
  }
});

pool.on('error', (err: Error) => {
  logger.error('PostgreSQL error', err);
  process.exit(1);
});

export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed');
  } catch (err) {
    logger.error('Error closing PostgreSQL pool', err);
  }
};

export const postgresClient = pool;
export default pool;
