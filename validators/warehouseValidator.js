const { z } = require('zod');

const createWarehouseSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
    address: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        pincode: z.string().trim().optional(),
        country: z.string().trim().default('India')
    }).optional(),
    contactPerson: z.string().trim().optional(),
    contactPhone: z.string().trim().optional(),
    isActive: z.boolean().default(true),
    parentCategoryId: z.string().optional().nullable(),
});

const updateWarehouseSchema = createWarehouseSchema.partial();

module.exports = { createWarehouseSchema, updateWarehouseSchema };
