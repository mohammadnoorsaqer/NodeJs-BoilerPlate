import { Sequelize } from 'sequelize';
import config from '../../config/config';
import { initUserModel, User } from './user.model';

const sequelize = new Sequelize(
  config.sqlDB.database,
  config.sqlDB.user,
  config.sqlDB.password,
  {
    host: config.sqlDB.host,
    port: config.sqlDB.port,
    dialect: config.sqlDB.dialect,
    pool: config.sqlDB.pool,
    define: config.sqlDB.define,
    logging: false,
  },
);

initUserModel(sequelize);

const db = {
  sequelize,
  Sequelize,
  users: User,
  User,
};

export type Database = typeof db;
export { sequelize, User, User as users };
export default db;
