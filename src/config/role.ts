import { AccessControl } from 'accesscontrol';
import { rolesEnum } from '../types/roles';

const ac = new AccessControl();

const resources = {
  USERINFO: 'User',
  ROLE: 'Role',
} as const;

const grantsObject = {
  [rolesEnum.SUPERADMIN]: Object.fromEntries(
    Object.values(resources).map((res) => [
      res,
      {
        'create:any': ['*'],
        'read:any': ['*'],
        'update:any': ['*'],
        'delete:any': ['*'],
      },
    ]),
  ),
  [rolesEnum.USER]: {
    [resources.USERINFO]: {
      'create:own': ['*'],
      'read:own': ['*'],
      'update:own': ['*'],
      'delete:own': ['*'],
    },
  },
};

ac.setGrants(grantsObject);

export const roles = ac;
export { resources, rolesEnum };
