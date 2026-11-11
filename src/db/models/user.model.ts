import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { UserRole } from '../../types/roles';

export type UserGender = 'male' | 'female';

export interface UserAttributes {
  id: string;
  username: string | null;
  username_ar: string;
  email: string;
  password_hash: string | null;
  phone_number: string | null;
  gender: UserGender | null;
  role: UserRole;
  firebase_token: string | null;
  firebase_uid: string | null;
  on_boarding: boolean;
  last_login: Date | null;
  is_active: boolean;
  token_version: number;
  reason_en: string | null;
  is_deleted: boolean;
  deletion_request_approved: boolean;
  latitude: string | null;
  longitude: string | null;
  reason_ar: string | null;
  date_of_birth: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'username'
  | 'password_hash'
  | 'phone_number'
  | 'gender'
  | 'firebase_token'
  | 'firebase_uid'
  | 'on_boarding'
  | 'last_login'
  | 'is_active'
  | 'token_version'
  | 'reason_en'
  | 'is_deleted'
  | 'deletion_request_approved'
  | 'latitude'
  | 'longitude'
  | 'reason_ar'
  | 'date_of_birth'
  | 'createdAt'
  | 'updatedAt'
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare username: string | null;
  declare username_ar: string;
  declare email: string;
  declare password_hash: string | null;
  declare phone_number: string | null;
  declare gender: UserGender | null;
  declare role: UserRole;
  declare firebase_token: string | null;
  declare firebase_uid: string | null;
  declare on_boarding: boolean;
  declare last_login: Date | null;
  declare is_active: boolean;
  declare token_version: number;
  declare reason_en: string | null;
  declare is_deleted: boolean;
  declare deletion_request_approved: boolean;
  declare latitude: string | null;
  declare longitude: string | null;
  declare reason_ar: string | null;
  declare date_of_birth: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUserModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      username_ar: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(155),
        unique: true,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'superadmin'),
        allowNull: false,
      },
      firebase_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      firebase_uid: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
      },
      on_boarding: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      token_version: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      reason_en: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      deletion_request_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
      },
      reason_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true,
      modelName: 'users',
    },
  );

  return User;
}
