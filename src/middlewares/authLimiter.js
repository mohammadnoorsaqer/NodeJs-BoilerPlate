const httpStatus = require('http-status').default;
const ApiError = require('../utils/ApiError');
const { RateLimiterPostgres } = require('rate-limiter-flexible');
const config = require('../config/config');
const postgres = require('../config/postgres');
const emailIpBruteLimiter = new RateLimiterPostgres({
  storeClient: postgres,
  storeType: 'pg',
  points: config.rateLimiter.maxAttemptsByIpEmail,
  duration: 60 * 10,
  blockDuration: 60 * 60 * 24,
  dbName: config.sqlDB.database,
});
const slowerBruteLimiter = new RateLimiterPostgres({
  storeClient: postgres,
  storeType: 'pg',
  points: config.rateLimiter.maxAttemptsPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
  dbName: config.sqlDB.database,
});
const emailBruteLimiter = new RateLimiterPostgres({
  storeClient: postgres,
  storeType: 'pg',
  points: config.rateLimiter.maxAttemptsPerEmail,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
  dbName: config.sqlDB.database,
});
const authLimiter = async (req, res, next) => {
  try {
    const ipAddress = req.ip;
    const emailIpKey = `${req.body.email}_${ipAddress}`;

    const [emailIpRes, slowerBruteRes, emailBruteRes] = await Promise.all([
      emailIpBruteLimiter.get(emailIpKey),
      slowerBruteLimiter.get(ipAddress),
      emailBruteLimiter.get(req.body.email),
    ]);

    let retrySeconds = 0; // ✅ FIXED

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
      return next(
        new ApiError(
          httpStatus.TOO_MANY_REQUESTS,
          'Too many requests',
          'عدد كبير من المحاولات، حاول لاحقاً',
          null,
          retrySeconds,
        ),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authLimiter,
  slowerBruteLimiter,
  emailIpBruteLimiter,
  emailBruteLimiter,
};
