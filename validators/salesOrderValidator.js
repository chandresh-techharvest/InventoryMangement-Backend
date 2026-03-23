const { z } = require('zod');

const soItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
    unitPrice: z.number({ required_error: 'Unit price is required' }).min(0),
    tax: z.number().min(0).max(100).default(0)
});

const createSalesOrderSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    items: z.array(soItemSchema).min(1, 'At least one item is required'),
    notes: z.string().trim().optional()
});

const updateSOStatusSchema = z.object({
    status: z.enum(['confirmed', 'fulfilled', 'cancelled'], {
        errorMap: () => ({ message: 'Status must be confirmed, fulfilled or cancelled' })
    })
});

module.exports = { createSalesOrderSchema, updateSOStatusSchema };
