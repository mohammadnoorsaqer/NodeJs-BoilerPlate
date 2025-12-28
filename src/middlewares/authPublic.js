const passport = require("passport");
const authPublic = async (req, res, next) => {
  return new Promise((resolve) => {
    passport.authenticate("jwt", { session: false }, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      resolve();
    })(req, res, next);
  })
    .then(() => {
      next();
    })
    .catch(() => {
      next();
    });
};

module.exports = authPublic;
