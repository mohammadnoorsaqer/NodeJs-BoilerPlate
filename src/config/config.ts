import joi from 'joi';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

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
    SQL_PASSWORD: joi.string().allow('').optional(),
    DB_PORT: joi.number().optional(),
    JWT_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRATION_MINUTES: joi.number().required(),
    JWT_REFRESH_EXPIRATION_MINUTES: joi.number().required(),
    REDIS_HOST: joi.string().required(),
    REDIS_PORT: joi.number().required(),
    REDIS_PASSWORD: joi.string().allow('', null).optional(),
    CACHE_TTL_SECONDS: joi.number().optional(),
    AWS_REGION: joi.string().required(),
    AWS_ACCESS_KEY_ID: joi.string().required(),
    AWS_SECRET_ACCESS_KEY: joi.string().required(),
    AWS_BUCKET_NAME: joi.string().required(),
    CDN_DOMAIN: joi.string().allow('', null).optional(),
    MAX_ATTEMPTS_PER_DAY: joi.number().required(),
    MAX_ATTEMPTS_BY_IP_EMAIL: joi.number().required(),
    MAX_ATTEMPTS_PER_EMAIL: joi.number().required(),
  })
  .unknown();

const { value: envVars, error } = envVarSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  logger.error(error);
  throw new Error(`Environment validation failed: ${error.message}`);
}

const config = {
  NODE_ENV: envVars.NODE_ENV as 'development' | 'staging' | 'production',
  PORT: envVars.PORT as number,
  sqlDB: {
    user: envVars.SQL_USERNAME as string,
    password: (envVars.SQL_PASSWORD as string | undefined) ?? '',
    database: envVars.SQL_DATABASE_NAME as string,
    host: envVars.SQL_HOST as string,
    port: (envVars.DB_PORT as number | undefined) ?? 5432,
    dialect: 'postgres' as const,
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
    region: envVars.AWS_REGION as string,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY as string,
    bucketName: envVars.AWS_BUCKET_NAME as string,
    cdnDomain: (envVars.CDN_DOMAIN as string | null) || null,
  },
  redis: {
    host: envVars.REDIS_HOST as string,
    port: envVars.REDIS_PORT as number,
    password: (envVars.REDIS_PASSWORD as string | null) || null,
    ttl: Number(envVars.CACHE_TTL_SECONDS) || 300,
  },
  jwt: {
    secret: envVars.JWT_SECRET as string,
    JWT_ACCESS_EXPIRATION_MINUTES:
      Number(envVars.JWT_ACCESS_EXPIRATION_MINUTES) || 30,
    JWT_REFRESH_EXPIRATION_MINUTES:
      Number(envVars.JWT_REFRESH_EXPIRATION_MINUTES) || 1440,
  },
  rateLimiter: {
    maxAttemptsPerDay: envVars.MAX_ATTEMPTS_PER_DAY as number,
    maxAttemptsByIpEmail: envVars.MAX_ATTEMPTS_BY_IP_EMAIL as number,
    maxAttemptsPerEmail: envVars.MAX_ATTEMPTS_PER_EMAIL as number,
  },
} as const;

export default config;
