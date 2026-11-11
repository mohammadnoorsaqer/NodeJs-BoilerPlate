export const rolesEnum = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof rolesEnum)[keyof typeof rolesEnum];
