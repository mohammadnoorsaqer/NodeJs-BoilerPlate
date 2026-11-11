import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { VerifiedCallback } from 'passport-jwt';
import config from './config';
import { tokenTypes } from './tokens';
import type { TokenPayload } from '../types/jwt';
import { User } from '../db/models';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (
  payload: TokenPayload,
  done: VerifiedCallback,
): Promise<void> => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      done(null, false);
      return;
    }

    const user = await User.findByPk(payload.sub);

    if (!user) {
      done(null, false);
      return;
    }

    if (user.is_deleted || !user.is_active) {
      done(null, false);
      return;
    }

    const tokenVersion =
      payload.tokenVersion !== undefined ? payload.tokenVersion : null;
    const userTokenVersion = user.token_version || 0;

    if (tokenVersion !== null && tokenVersion !== userTokenVersion) {
      done(null, false);
      return;
    }

    done(null, user);
  } catch (error) {
    done(error as Error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
