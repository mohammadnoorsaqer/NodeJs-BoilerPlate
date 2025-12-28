const AccessControl = require('accesscontrol');

const ac = new AccessControl();

const rolesEnum = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
};

const resources = {
  USERINFO: 'User',
  ROLE: 'Role',
};

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

const roles = (function () {
  ac.setGrants(grantsObject);
  return ac;
})();

module.exports = {
  roles,
  resources,
  rolesEnum,
};
