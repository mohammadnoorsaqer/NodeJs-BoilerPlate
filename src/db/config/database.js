const appConfig = require('../../config/config');

const db = appConfig.sqlDB;

module.exports = {
  development: {
    username: db.user,
    password: db.password,
    database: db.database,
    host: db.host,
    port: db.port,
    dialect: db.dialect, // ✅ now correctly resolved
    pool: db.pool,
    define: db.define,
  },

  staging: {
    username: db.user,
    password: db.password,
    database: db.database,
    host: db.host,
    port: db.port,
    dialect: db.dialect,
    pool: db.pool,
    define: db.define,
  },

  production: {
    username: db.user,
    password: db.password,
    database: db.database,
    host: db.host,
    port: db.port,
    dialect: db.dialect,
    pool: db.pool,
    define: db.define,
  },
};
