import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { User } from '../db/models';
import { userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import type { SafeUser } from '../repositories/user.repository';
import type { UserCreationAttributes } from '../db/models/user.model';

type RegisterUserInput = Omit<UserCreationAttributes, 'password_hash'> & {
  password?: string;
};

export async function createUser(userBody: RegisterUserInput): Promise<SafeUser> {
  if (await userRepository.getUserByEmail(userBody.email)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      'البريد الإلكتروني مستخدم بالفعل',
    );
  }

  const { password, ...rest } = userBody;
  const payload: UserCreationAttributes = { ...rest };

  if (password) {
    payload.password_hash = await bcrypt.hash(password, 10);
  }

  payload.is_active = payload.is_active ?? true;
  payload.is_deleted = false;
  payload.token_version = payload.token_version ?? 0;
  payload.last_login = new Date();

  const user = await User.create(payload);

  const userObj = user.get({ plain: true });
  const { password_hash: _passwordHash, ...safeUser } = userObj;
  return safeUser;
}

export const userService = {
  createUser,
};
