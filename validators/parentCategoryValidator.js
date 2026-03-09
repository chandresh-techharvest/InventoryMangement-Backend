const { body } = require('express-validator');

exports.validateCreateParentCategory = [
    body('name')
        .notEmpty().withMessage('Parent category name is required')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

    body('description')
        .optional()
        .trim()
];

exports.validateUpdateParentCategory = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

    body('description')
        .optional()
        .trim()
];