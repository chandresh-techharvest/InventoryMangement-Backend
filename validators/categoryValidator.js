const { z } = require('zod');

// Create category schema
const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').trim(),
    parentCategoryId: z.string().optional().nullable(),
    description: z.string().trim().optional(),
    isActive: z.boolean().default(true)
});

// Update category schema
const updateCategorySchema = z.object({
    name: z.string().min(1).trim().optional(),
    parentCategoryId: z.string().optional().nullable(),
    description: z.string().trim().optional(),
    isActive: z.boolean().optional()
});

// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    validateCreateCategory: validate(createCategorySchema),
    validateUpdateCategory: validate(updateCategorySchema)
};
