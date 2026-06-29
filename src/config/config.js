const joi = require('joi');
const dotenv = require('dotenv');
dotenv.config();
const logger = require('./logger'); // make sure you import your logger

// Validate environment variables
const envVarSchema = joi
  .object({
    NODE_ENV: joi
      .string()
      .valid('development', 'staging', 'production')
      .required(),
    PORT: joi.number().required(),
    SQL_USERNAME: joi.string().required(),
    SQL_HOST: joi.string().required(),
    SQL_DATABASE_NAME: joi.string().required(),
    SQL_PASSWORD: joi.string().optional(),
    JWT_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRATION_MINUTES: joi.number().required(),
    JWT_REFRESH_EXPIRATION_MINUTES: joi.number().required(),
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    AWS_REGION: joi.string().required(),
    AWS_ACCESS_KEY_ID: joi.string().required(),
    AWS_SECRET_ACCESS_KEY: joi.string().required(),
    AWS_BUCKET_NAME: joi.string().required(),
    CDN_DOMAIN: joi.string().optional(),
    MAX_ATTEMPTS_PER_DAY: joi.number().required(),
    MAX_ATTEMPTS_BY_IP_EMAIL: joi.number().required(),
    MAX_ATTEMPTS_PER_EMAIL: joi.number().required(),
  })
  .unknown();

const { value: envVars, error } = envVarSchema.validate(process.env);

if (error) {
  logger.error(error);
}

module.exports = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  sqlDB: {
    user: envVars.SQL_USERNAME,
    password: envVars.SQL_PASSWORD,
    database: envVars.SQL_DATABASE_NAME,
    host: envVars.SQL_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
    },
  },
  s3: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    bucketName: envVars.AWS_BUCKET_NAME,
    cdnDomain: envVars.CDN_DOMAIN || null,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || null,
    ttl: Number(envVars.CACHE_TTL_SECONDS) || 300,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    JWT_ACCESS_EXPIRATION_MINUTES:
      Number(envVars.JWT_ACCESS_EXPIRATION_MINUTES) || 30,
    JWT_REFRESH_EXPIRATION_MINUTES:
      Number(envVars.JWT_REFRESH_EXPIRATION_MINUTES) || 1440,
  },
  rateLimiter: {
    maxAttemptsPerDay: envVars.MAX_ATTEMPTS_PER_DAY,
    maxAttemptsByIpEmail: envVars.MAX_ATTEMPS_BY_IP_EMAIL,
    maxAttemptsPerEmail: envVars.MAX_ATTEMPS_PER_EMAIL,
  },
};
