import httpStatus from 'http-status';
import type { Permission } from 'accesscontrol';
import type { NextFunction, Request, Response } from 'express';
import { roles } from '../config/role';
import { ApiError } from '../utils/ApiError';

export function grantAccess(action: string, resource: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.role) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authentication required',
          'المصادقة مطلوبة',
        );
      }

      const authenticatedUserId = req.user.id;
      const targetUserIdParam = req.params.userId ?? req.params.id;

      const isOwnResource = authenticatedUserId === targetUserIdParam;

      const modifiedAction = isOwnResource
        ? action.replace('Any', 'Own')
        : action;

      const permission = (
        roles.can(req.user.role) as unknown as Record<
          string,
          (resource: string) => Permission
        >
      )[modifiedAction](resource);

      if (!permission.granted) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You are not authorized to access this resource',
          'ليس لديك صلاحية للوصول إلى هذا المورد',
        );
      }

      req.permission = permission;
      next();
    } catch (error) {
      next(error);
    }
  };
}
