# Auth Flow (Passport JWT)

This project uses Passport JWT with token versioning and a public-route bypass. Quick guide to understand and use the auth endpoints.

## Overview
- **Access Token (short-lived)**: Bearer in `Authorization: Bearer <token>`.
- **Refresh Token (longer-lived)**: Bearer for `/v1/auth/refresh-token`. Not persisted; token versioning is used to revoke.
- **Token Versioning**: `users.token_version` is embedded in both tokens; bumping it revokes all current tokens.
- **Status Checks**: Tokens are rejected if the user is `is_deleted`, `is_active` is false, or `is_active_user` is false.
- **Public Routes**: Paths listed in `src/middlewares/authPublic.js` skip auth; everything else requires a valid access token.

## Endpoints
- `POST /v1/auth/register`
  - Body: `{ username, username_ar, email, password, phone_number, gender, role }`
  - Returns: `user`, `tokens.access`, `tokens.refresh`
- `POST /v1/auth/login`
  - Body: `{ email, password }`
  - Returns: `user`, `tokens.access`, `tokens.refresh`
- `POST /v1/auth/refresh-token`
  - Body: `{ refreshToken }`
  - Returns: new `tokens.access`, `tokens.refresh`
  - Fails if token is invalid/expired or `tokenVersion` mismatch.
- `POST /v1/auth/logout`
  - Auth: `Authorization: Bearer <accessToken>`
  - Action: increments `token_version` to revoke all existing tokens for the user.

## How verification works
- `src/config/passport.js`:
  - Validates signature, `type === ACCESS`, tokenVersion matches `user.token_version`, and user is active/not deleted.
- `src/middlewares/auth.js`:
  - Wraps `passport.authenticate('jwt', { session: false })`; rejects with 401 on failure.
- `src/middlewares/authPublic.js`:
  - If request matches a public path (by `req.path` or `req.originalUrl`), skips auth; otherwise enforces `auth()`.

## Headers & usage
- Protected requests: `Authorization: Bearer <accessToken>`
- Refresh: `Authorization` header not required; just send the refresh token in body.

## Revocation
- **Logout**: increments `token_version`; all issued access/refresh tokens stop working.
- **Password change / admin deactivate (recommended)**: call the same revoker to bump `token_version`.

## Validation
- Register/login schemas in `src/validation/user.validation.js`; strong-password rule in `src/validation/custom.validation.js`.

## Tips
- Use HTTPS in production; consider httpOnly cookies if you move tokens to cookies.
- Add rate limiting on `/auth/login` and `/auth/refresh-token`.
- Keep JWT secret strong and in env (`JWT_SECRET`). Optionally separate secrets for access/refresh.


