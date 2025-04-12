const { validationResult } = require('express-validator');
const { respond } = require('../utils/helper');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        return respond(res, false, 422, errors.array()[0].msg);
    }
    next();
};
