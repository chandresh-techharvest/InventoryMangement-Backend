const { z } = require('zod');

// Product variant schema
const variantSchema = z.object({
    attributes: z.record(z.string(), z.string()).optional().default({}),
    price: z.number().min(0, 'Price must be positive'),
    cost: z.number().min(0, 'Cost must be positive')
});

// Create product schema
const createProductSchema = z.object({
    sku: z.string().min(1, 'SKU is required').trim().toUpperCase(),
    barcode: z.string().trim().optional(),
    name: z.string().min(1, 'Product name is required').trim(),
    description: z.string().trim().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    brand: z.string().trim().optional(),
    uom: z.enum(['PCS', 'KG', 'L', 'M', 'BOX', 'DOZEN'], {
        errorMap: () => ({ message: 'Invalid unit of measure' })
    }).default('PCS'),
    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
    taxRate: z.number().min(0).max(100).default(0),
    isActive: z.boolean().default(true)
});

// Update product schema (all fields optional except ID)
const updateProductSchema = z.object({
    sku: z.string().min(1).trim().toUpperCase().optional(),
    barcode: z.string().trim().optional(),
    name: z.string().min(1).trim().optional(),
    description: z.string().trim().optional(),
    categoryId: z.string().min(1).optional(),
    brand: z.string().trim().optional(),
    uom: z.enum(['PCS', 'KG', 'L', 'M', 'BOX', 'DOZEN']).optional(),
    variants: z.array(variantSchema).min(1).optional(),
    taxRate: z.number().min(0).max(100).optional(),
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
    validateCreateProduct: validate(createProductSchema),
    validateUpdateProduct: validate(updateProductSchema)
};
