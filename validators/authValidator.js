const { z } = require('zod');

const registerSchema = z.object({
    businessName: z.string()
        .min(1, 'Business name is required')
        .max(100, 'Business name must be less than 100 characters')
        .trim(),
    fullName: z.string()
        .min(1, 'Full name is required')
        .max(100, 'Full name must be less than 100 characters')
        .trim(),
    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(50, 'Password must be less than 50 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(1, 'Password is required')
});

const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            // In Zod v4, errors are in result.error.issues, not result.error.errors
            const zodErrors = result.error.issues || result.error.errors || [];

            const errors = zodErrors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // Update req.body with parsed data (trimmed, lowercased, etc.)
        req.body = result.data;
        next();
    };
};

module.exports = {
    registerSchema,
    loginSchema,
    validate
};
