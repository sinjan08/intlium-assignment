const { body } = require('express-validator');
const { User } = require('../../models');

exports.validateRegistration = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
        .isEmail().withMessage('Invalid email')
        .normalizeEmail()
        .custom(async (value) => {
            const existingUser = await User.findOne({ where: { email: value } });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain a special character'),
    body('profile_image')
        .optional()
        .isURL().withMessage('Profile image must be a valid URL'),
];

exports.validateLogin = [
    body('email')
        .isEmail().withMessage('Invalid email')
        .normalizeEmail()
        .custom(async (value) => {
            const user = await User.findOne({ where: { email: value, is_active: true } });
            if (!user) {
                throw new Error('User is not active.')
            }
            return true;
        }),
    body('password')
        .notEmpty().withMessage('Password is required'),
];
