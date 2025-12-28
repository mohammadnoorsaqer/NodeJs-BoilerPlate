const express = require("express");
const router = express.Router();
const { authController } = require("../../controller");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const { userValidation } = require("../../validation");
const { authLimiter } = require("../../middlewares/authLimiter");

router.post(
  "/register",
  validate(userValidation.registerSchema),
  authController.register
);
router.post(
  "/login",
  authLimiter,
  validate(userValidation.loginSchema),
  authController.login
);
router.post(
  "/refresh-token",
  validate(userValidation.refreshTokenSchema),
  authController.refreshToken
);
// Best Practice: Logout requires valid access token (user must be authenticated)
// If access token is expired, user is already effectively logged out
router.post("/logout", auth(), authController.logout);
module.exports = router;
