const passport = require('passport');
const { respond } = require('../utils/helper');
module.exports = passport.authenticate('jwt', { session: false });


module.exports = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err || !user) {
            return respond(res, false, 401, 'Authentication failed');
        }
        req.user = user;
        return next();
    })(req, res, next);
};