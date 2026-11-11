import type { Pool } from 'pg';
import type { Sequelize } from 'sequelize';
import type { Permission } from 'accesscontrol';
import type { User } from '../db/models/user.model';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    sequelize?: Sequelize;
    postgres?: Pool;
    permission?: Permission;
  }
}

export {};
