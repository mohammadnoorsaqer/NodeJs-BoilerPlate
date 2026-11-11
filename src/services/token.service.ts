import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import config from '../config/config';
import { tokenTypes } from '../config/tokens';
import type { TokenPayload, TokenType } from '../types/jwt';
import type { UserRole } from '../types/roles';
import { ApiError } from '../utils/ApiError';
import { userRepository } from '../repositories';

interface GenerateTokenParams {
  userId: string;
  expires: number;
  role: UserRole;
  type: TokenType;
  tokenVersion: number;
  secret?: string;
}

const generateToken = ({
  userId,
  expires,
  role,
  type,
  tokenVersion,
  secret = config.jwt.secret,
}: GenerateTokenParams): string => {
  const payload: TokenPayload = {
    sub: userId,
    role,
    iat: dayjs().unix(),
    exp: expires,
    type,
    tokenVersion,
  };

  return jwt.sign(payload, secret);
};

export const verifyToken = async (
  token: string,
  type: TokenType,
): Promise<TokenPayload> => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (payload.type !== type) {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid token',
      'الرمز غير صالح',
    );
  }
};

export const generateAuthTokens = async ({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) => {
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      'المستخدم غير موجود',
    );
  }

  const tokenVersion = user.token_version ?? 0;

  const accessTokenExpires = dayjs()
    .add(config.jwt.JWT_ACCESS_EXPIRATION_MINUTES, 'minutes')
    .unix();

  const accessToken = generateToken({
    userId,
    role,
    expires: accessTokenExpires,
    type: tokenTypes.ACCESS,
    tokenVersion,
  });

  const refreshTokenExpires = dayjs()
    .add(config.jwt.JWT_REFRESH_EXPIRATION_MINUTES, 'minutes')
    .unix();

  const refreshToken = generateToken({
    userId,
    role,
    expires: refreshTokenExpires,
    type: tokenTypes.REFRESH,
    tokenVersion,
  });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

export const tokenService = {
  verifyToken,
  generateAuthTokens,
};
