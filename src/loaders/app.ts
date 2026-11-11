import express, { type Application } from 'express';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { xss } from 'express-xss-sanitizer';
import httpStatus from 'http-status';
import { successHandler, errorHandler } from '../config/morgan';
import { ApiError } from '../utils/ApiError';
import db from '../db/models';
import { postgresClient } from '../config/postgres';
import { errorConverter, errorHandler as globalErrorHandler } from '../middlewares/error';
import { jwtStrategy } from '../config/passport';
import routes from '../routes/v1';

export const loadApp = async (app: Application): Promise<Application> => {
  app.use((req, _res, next) => {
    req.sequelize = db.sequelize;
    req.postgres = postgresClient;
    next();
  });

  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers.authorization) return false;
        return compression.filter(req, res);
      },
    }),
  );

  app.use(express.json());
  app.use(xss());
  app.use(helmet());
  app.use(cors());
  app.use(successHandler);
  app.use(errorHandler);

  app.use(passport.initialize());
  passport.use(jwtStrategy);

  app.use('/v1', routes);

  app.use((_req, _res, next) => {
    next(
      new ApiError(
        httpStatus.NOT_FOUND,
        'Not found',
        'لم يتم العثور على الصفحة',
      ),
    );
  });

  app.use(errorConverter);
  app.use(globalErrorHandler);

  return app;
};

export default loadApp;
