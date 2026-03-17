const { z, object } = require('zod');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
  .nullable()
  .optional();

const createWarehouseSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
    parentCategoryId: objectId,
    address: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        pincode: z.string().trim().optional(),
        country: z.string().trim().default('India')
    }).optional(),
    contactPerson: z.string().trim().optional(),
    contactPhone: z.string().trim().optional(),
    isActive: z.boolean().default(true)
});

const updateWarehouseSchema = createWarehouseSchema.partial();

module.exports = { createWarehouseSchema, updateWarehouseSchema };
