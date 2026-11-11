import httpStatus from 'http-status';
import { RateLimiterPostgres } from 'rate-limiter-flexible';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import config from '../config/config';
import postgres from '../config/postgres';

const limiterOptions = {
  storeClient: postgres,
  storeType: 'pg' as const,
  dbName: config.sqlDB.database,
};

export const emailIpBruteLimiter = new RateLimiterPostgres({
  ...limiterOptions,
  points: config.rateLimiter.maxAttemptsByIpEmail,
  duration: 60 * 10,
  blockDuration: 60 * 60 * 24,
});

export const slowerBruteLimiter = new RateLimiterPostgres({
  ...limiterOptions,
  points: config.rateLimiter.maxAttemptsPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

export const emailBruteLimiter = new RateLimiterPostgres({
  ...limiterOptions,
  points: config.rateLimiter.maxAttemptsPerEmail,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

export const authLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ipAddress = req.ip ?? 'unknown';
    const email = req.body.email as string | undefined;
    if (!email) {
      next();
      return;
    }

    const emailIpKey = `${email}_${ipAddress}`;

    const [emailIpRes, slowerBruteRes, emailBruteRes] = await Promise.all([
      emailIpBruteLimiter.get(emailIpKey),
      slowerBruteLimiter.get(ipAddress),
      emailBruteLimiter.get(email),
    ]);

    let retrySeconds = 0;

    if (
      slowerBruteRes &&
      slowerBruteRes.consumedPoints > config.rateLimiter.maxAttemptsPerDay
    ) {
      retrySeconds = Math.floor(slowerBruteRes.msBeforeNext / 1000);
    } else if (
      emailIpRes &&
      emailIpRes.consumedPoints > config.rateLimiter.maxAttemptsByIpEmail
    ) {
      retrySeconds = Math.floor(emailIpRes.msBeforeNext / 1000);
    } else if (
      emailBruteRes &&
      emailBruteRes.consumedPoints > config.rateLimiter.maxAttemptsPerEmail
    ) {
      retrySeconds = Math.floor(emailBruteRes.msBeforeNext / 1000);
    }

    if (retrySeconds > 0) {
      res.set('Retry-After', String(retrySeconds));
      next(
        new ApiError(
          httpStatus.TOO_MANY_REQUESTS,
          'Too many requests',
          'عدد كبير من المحاولات، حاول لاحقاً',
          true,
          retrySeconds,
        ),
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
