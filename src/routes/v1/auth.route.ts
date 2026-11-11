import { Router } from 'express';
import { authController } from '../../controller';
import validate from '../../middlewares/validate';
import auth from '../../middlewares/auth';
import { userValidation } from '../../validation';
import { authLimiter } from '../../middlewares/authLimiter';

const router = Router();

router.post(
  '/register',
  validate(userValidation.registerSchema),
  authController.register,
);

router.post(
  '/login',
  authLimiter,
  validate(userValidation.loginSchema),
  authController.login,
);

router.post(
  '/refresh-token',
  validate(userValidation.refreshTokenSchema),
  authController.refreshToken,
);

router.post('/logout', auth(), authController.logout);

export default router;
