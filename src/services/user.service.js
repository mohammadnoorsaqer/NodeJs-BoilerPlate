const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { users } = require('../db/models');
const ApiError = require('../utils/ApiError');

/**
 * Create a new user
 */
async function createUser(userBody) {
  // Check if email already exists
  if (await getUserByEmail(userBody.email)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      'البريد الإلكتروني مستخدم بالفعل',
    );
  }

  // Hash password
  if (userBody.password) {
    userBody.password_hash = await bcrypt.hash(userBody.password, 10);
    delete userBody.password;
  }

  // Set default values
  userBody.is_active = userBody.is_active ?? true;
  userBody.is_deleted = false;
  userBody.token_version = userBody.token_version ?? 0;
  userBody.last_login = new Date();

  const user = await users.create(userBody);

  // Remove sensitive data
  const userObj = user.get({ plain: true });
  delete userObj.password_hash;

  return userObj;
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  const user = await users.findByPk(id);
  return user;
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const user = await users.findOne({ where: { email } });
  return user;
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
};
