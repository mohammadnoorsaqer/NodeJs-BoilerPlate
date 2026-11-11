import type { Application } from 'express';
import loadApp from './app';
import logger from '../config/logger';

export const load = async (app: Application): Promise<void> => {
  await loadApp(app);
  logger.info('Loaded app');
};

export default load;
