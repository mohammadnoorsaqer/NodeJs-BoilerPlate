import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import type { User } from '../db/models/user.model';

export const authPublic = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await new Promise<void>((resolve) => {
      passport.authenticate(
        'jwt',
        { session: false },
        (err: Error | null, user: User | false) => {
          if (!err && user) {
            req.user = user;
          }
          resolve();
        },
      )(req, _res, next);
    });
    next();
  } catch {
    next();
  }
};

export default authPublic;
