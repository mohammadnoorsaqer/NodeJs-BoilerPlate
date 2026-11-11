import crypto from 'crypto';

export const sanitizeString = (
  value: unknown,
  allowUnderscore = true,
): string | null => {
  if (!value) return null;
  const pattern = allowUnderscore ? /[^a-zA-Z0-9_-]/g : /[^a-zA-Z0-9-]/g;
  return String(value).replace(pattern, '').substring(0, 50);
};

export const sanitizeNumber = (
  value: unknown,
  defaultValue = 1,
  min = 1,
  max = 1000,
): number => {
  const num = parseInt(String(value), 10);
  if (Number.isNaN(num) || num < min || num > max) return defaultValue;
  return num;
};

export const sanitizeUUID = (value: unknown): string | null => {
  if (!value) return null;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const str = String(value);
  return uuidPattern.test(str) ? str : null;
};

export const containsDangerousPatterns = (key: string): boolean => {
  const dangerousPatterns = [
    /[;\r\n]/,
    /\s(SET|GET|DEL|FLUSHDB|FLUSHALL|EVAL|SCRIPT|KEYS|CONFIG)\s/i,
    /[{}[\]]/,
    /['"]/,
    /\|/,
    /\$/,
    /`/,
    /\.\./,
    /\*/,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(key));
};

export const createSecureCacheKey = (parts: string[]): string => {
  const key = parts.join(':');

  if (containsDangerousPatterns(key)) {
    throw new Error('Invalid cache key parameters detected');
  }

  return key;
};

export const hashFilters = (filters: Record<string, unknown>): string => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  );

  const paramString = JSON.stringify(
    cleanParams,
    Object.keys(cleanParams).sort(),
  );
  return crypto
    .createHash('sha256')
    .update(paramString)
    .digest('hex')
    .substring(0, 16);
};
