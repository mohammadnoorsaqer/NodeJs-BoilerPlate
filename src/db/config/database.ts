import type { Options } from 'sequelize';
import appConfig from '../../config/config';

const db = appConfig.sqlDB;

interface SequelizeCliEnv {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: Options['dialect'];
  pool: Options['pool'];
  define: Options['define'];
}

const baseConfig: SequelizeCliEnv = {
  username: db.user,
  password: db.password,
  database: db.database,
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  pool: db.pool,
  define: db.define,
};

export = {
  development: baseConfig,
  staging: baseConfig,
  production: baseConfig,
};
