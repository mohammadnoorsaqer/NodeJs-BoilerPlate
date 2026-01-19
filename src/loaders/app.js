const express = require('express');
const morgan = require('../config/morgan');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status').default;
const db = require('../db/models/index'); // Sequelize
const { postgresClient } = require('../config/postgres'); // Raw Postgres
const { errorConverter, errorHandler } = require('../middlewares/error');
const passport = require('passport');
const { jwtStrategy } = require('../config/passport');
const { xss } = require('express-xss-sanitizer');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const routes = require('../routes/v1');
module.exports = async (app) => {
  app.use((req, res, next) => {
    req.sequelize = db.sequelize;
    req.postgres = postgresClient;
    next();
  });

  //compression middleware
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['authorization']) return false; // skip compression if auth header exists
        return compression.filter(req, res);
      },
    }),
  );

  // JSON middleware
  app.use(express.json());

  //Security
  app.use(xss());
  app.use(helmet());

  //Enabling All cors
  app.use(cors());
  // Logging middleware
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);

  // jwt authentication middleware
  app.use(passport.initialize());
  passport.use(jwtStrategy);

  // --------------------
  // Routes
  app.use('/v1', routes);

  // --------------------
  // 404 handler
  // --------------------
  app.use((req, res, next) => {
    // Try this first:
    next(
      new ApiError(
        httpStatus.NOT_FOUND,
        'Not found',
        'لم يتم العثور على الصفحة',
      ),
    );
  });

  // convert error to ApiError, if needed
  app.use(errorConverter);

  // handle error
  app.use(errorHandler);
  return app;
};
