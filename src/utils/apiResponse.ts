import type { Response } from 'express';

interface AuthTokens {
  access: { token: string; expires: number };
  refresh: { token: string; expires: number };
}

export const successResponse = <T>(
  res: Response,
  statusCode: number,
  enMessage: string,
  arMessage: string,
  data: T | null = null,
  token: AuthTokens | null = null,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message: {
      en: enMessage,
      ar: arMessage,
    },
    data,
    ...(token && { token }),
  });
};
