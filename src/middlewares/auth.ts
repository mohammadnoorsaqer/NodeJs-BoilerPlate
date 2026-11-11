import passport from 'passport';
import httpStatus from 'http-status';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../types/roles';
import type { User } from '../db/models/user.model';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (err: Error) => void) =>
  (err: Error | null, user: User | false, info: unknown): void => {
    if (err || info || !user) {
      reject(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Please authenticate',
          'الرجاء المصادقة',
        ),
      );
      return;
    }

    req.user = user;
    resolve();
  };

export const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        passport.authenticate(
          'jwt',
          { session: false },
          verifyCallback(req, resolve, reject),
        )(req, res, next);
      });

      if (requiredRoles.length > 0) {
        const userRole = req.user?.role;
        if (!userRole || !requiredRoles.includes(userRole)) {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            'Insufficient permissions',
            'صلاحيات غير كافية',
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
