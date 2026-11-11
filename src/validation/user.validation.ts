import Joi from 'joi';
import { password } from './custom.validation';
import { rolesEnum } from '../types/roles';

export const registerSchema = {
  body: Joi.object({
    username: Joi.string().required(),
    username_ar: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.custom(password).required(),
    phone_number: Joi.string().required(),
    gender: Joi.string().valid('male', 'female').required(),
    role: Joi.string()
      .valid(rolesEnum.ADMIN, rolesEnum.SUPERADMIN, rolesEnum.USER)
      .required(),
    firebase_token: Joi.string().optional(),
    firebase_uid: Joi.string().optional(),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const userValidation = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
