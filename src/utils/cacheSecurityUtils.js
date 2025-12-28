const crypto = require("crypto");

// Utility functions for cache key sanitization
const sanitizeString = (value, allowUnderscore = true) => {
  if (!value) return null;
  const pattern = allowUnderscore ? /[^a-zA-Z0-9_-]/g : /[^a-zA-Z0-9-]/g;
  return String(value).replace(pattern, "").substring(0, 50);
};

const sanitizeNumber = (value, defaultValue = 1, min = 1, max = 1000) => {
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) return defaultValue;
  return num;
};

const sanitizeUUID = (value) => {
  if (!value) return null;
  // UUID format: 8-4-4-4-12 characters (hexadecimal)
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value) ? value : null;
};

const containsDangerousPatterns = (key) => {
  const dangerousPatterns = [
    /[;\r\n]/, // Command separators
    /\s(SET|GET|DEL|FLUSHDB|FLUSHALL|EVAL|SCRIPT|KEYS|CONFIG)\s/i, // Redis commands
    /[{}[\]]/, // JSON/array brackets
    /['"]/, // Quotes
    /\|/, // Pipes
    /\$/, // Variable expansion
    /`/, // Command substitution
    /\.\./, // Path traversal
    /\*/, // Wildcards (except in patterns)
  ];

  return dangerousPatterns.some((pattern) => pattern.test(key));
};

const createSecureCacheKey = (parts) => {
  const key = parts.join(":");

  if (containsDangerousPatterns(key)) {
    throw new Error("Invalid cache key parameters detected");
  }

  return key;
};

const hashFilters = (filters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([_key, v]) => v !== undefined)
  );

  const paramString = JSON.stringify(
    cleanParams,
    Object.keys(cleanParams).sort()
  );
  return crypto
    .createHash("sha256")
    .update(paramString)
    .digest("hex")
    .substring(0, 16);
};

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeUUID,
  containsDangerousPatterns,
  createSecureCacheKey,
  hashFilters,
};
