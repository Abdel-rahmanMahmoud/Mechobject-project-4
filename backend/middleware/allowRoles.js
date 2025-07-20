const appError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.currentUser.role)) {
      return next(
        appError.createError("This role is not authorized", 401, httpStatusText.Fail)
      );
    }
    next();
  };
};

module.exports = allowRoles;