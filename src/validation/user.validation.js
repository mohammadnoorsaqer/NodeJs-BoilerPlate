const joi = require('joi');
const customValidation = require('./custom.validation');
const registerSchema = joi.object({
  username: joi.string().required(),
  username_ar: joi.string().required(),
  email: joi.string().email().required(),
  password_hash: joi.custom(customValidation.password).required(),
  phone_number: joi.string().required(),
  gender: joi.string().valid('male', 'female').required(),
  role: joi.string().valid('admin', 'superadmin', 'user').required(),
  firebase_token: joi.string().optional(),
  firebase_uid: joi.string().optional(),
});
const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});
const refreshTokenSchema = joi.object({
  refreshToken: joi.string().required(),
});
const logoutSchema = joi.object({
  // No body required, token is extracted from Authorization header
});
module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
};
