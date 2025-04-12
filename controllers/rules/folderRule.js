const { body } = require('express-validator');

exports.validateCreateFolder = [
    body('name')
        .notEmpty()
        .withMessage('Name is required'),
    body('parent_id')
        .optional({ nullable: true })
        .isInt().withMessage('Parent ID must be an integer')
];


exports.updateFolder = [
    body('name')
        .notEmpty()
        .withMessage('Name is required'),
];

exports.deleteFolder = [
    body('id')
        .notEmpty()
        .withMessage('ID is required'),
];

exports.trashFolder = [
    body('id')
        .notEmpty()
        .withMessage('ID is required'),
]
