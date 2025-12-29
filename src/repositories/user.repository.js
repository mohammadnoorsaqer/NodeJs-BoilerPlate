const { users } = require('../db/models');

async function getUserByEmail(email) {
  const user = await users.findOne({ where: { email } });
  return user;
}
async function getUserById(id) {
  const user = await users.findByPk(id);
  return user;
}
module.exports = {
  getUserByEmail,
  getUserById,
};
