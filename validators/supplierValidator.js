const { z } = require('zod');

const createSupplierSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
    contactPerson: z.string().trim().optional(),
    email: z.string().email('Invalid email').trim().optional().or(z.literal('')),
    phone: z.string().trim().optional(),
    gstNumber: z.string().trim().optional(),
    address: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        pincode: z.string().trim().optional(),
        country: z.string().trim().default('India')
    }).optional(),
    paymentTerms: z.string().trim().optional(),
    isActive: z.boolean().default(true)
});

const updateSupplierSchema = createSupplierSchema.partial();

module.exports = { createSupplierSchema, updateSupplierSchema };
