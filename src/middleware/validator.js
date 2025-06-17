const { validationResult, check } = require('express-validator');

const validateExpense = [
    check('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be positive'),
    check('description')
        .notEmpty()
        .withMessage('Description is required')
        .trim(),
    check('paid_by')
        .notEmpty()
        .withMessage('Paid by is required')
        .trim(),
    check('split_between')
        .isArray()
        .withMessage('Split between must be an array')
        .notEmpty()
        .withMessage('Split between cannot be empty'),
    check('split_type')
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Invalid split type'),
    check('split_values')
        .optional()
        .isArray()
        .withMessage('Split values must be an array'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

const validateGroup = [
    check('name')
        .notEmpty()
        .withMessage('Group name is required')
        .trim(),
    check('admin')
        .notEmpty()
        .withMessage('Group admin is required')
        .trim(),
    check('members')
        .optional()
        .isArray()
        .withMessage('Members must be an array'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateExpense,
    validateGroup
};
