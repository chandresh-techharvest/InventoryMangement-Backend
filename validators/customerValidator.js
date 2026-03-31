const { z } = require('zod');

const createCustomerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
    phone: z.string().trim().optional(),
    email: z.string().email('Invalid email').trim().optional().or(z.literal('')),
    gstNumber: z.string().trim().optional(),
    address: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        pincode: z.string().trim().optional(),
        country: z.string().trim().default('India')
    }).optional(),
    isActive: z.boolean().default(true)
});

const updateCustomerSchema = createCustomerSchema.partial();

module.exports = { createCustomerSchema, updateCustomerSchema };
