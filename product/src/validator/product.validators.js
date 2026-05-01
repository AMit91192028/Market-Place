const { body, validationResult } = require('express-validator');


function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    next();
}

const createProductValidators = [
    body('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('title is required'),
    body('category')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('category is required'),
    body('description')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                return value.trim().length <= 1000;
            }

            if (Array.isArray(value)) {
                return value.every((item) => typeof item === 'string') &&
                    value.join('\n').trim().length <= 1000;
            }

            return false;
        })
        .withMessage('description must be text and no longer than 1000 characters'),
    body('priceAmount')
        .notEmpty()
        .withMessage('priceAmount is required')
        .bail()
        .isFloat({ gt: 0 })
        .withMessage('priceAmount must be a number > 0'),
    body('priceCurrency')
        .optional()
        .isIn([ 'USD', 'INR' ])
        .withMessage('priceCurrency must be USD or INR'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('stock must be a non-negative integer'),
    handleValidationErrors
];



module.exports = { createProductValidators };
