import type { UserRole } from './roles';

export const tokenTypes = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];

export interface TokenPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: TokenType;
  tokenVersion: number;
}
