import Joi from 'joi';
import httpStatus from 'http-status';
import type { NextFunction, Request, Response } from 'express';
import { pick } from '../utils/pick';
import { ApiError } from '../utils/ApiError';

type RequestPart = 'params' | 'query' | 'body';

type ValidationSchema = Partial<Record<RequestPart, Joi.ObjectSchema>>;

export const validate = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema) as RequestPart[]);
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' } })
      .validate(object);

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(', ');
      next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
      return;
    }

    Object.assign(req, value);
    next();
  };
};

export default validate;
