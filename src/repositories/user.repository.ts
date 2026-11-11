import { User } from '../db/models';
import type { UserAttributes } from '../db/models/user.model';

export async function getUserByEmail(
  email: string,
): Promise<User | null> {
  return User.findOne({ where: { email } });
}

export async function getUserById(id: string): Promise<User | null> {
  return User.findByPk(id);
}

export type SafeUser = Omit<UserAttributes, 'password_hash'>;

export const userRepository = {
  getUserByEmail,
  getUserById,
};
