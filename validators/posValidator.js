const { z } = require('zod');

const posItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
    unitPrice: z.number({ required_error: 'Unit price is required' }).min(0),
    tax: z.number().min(0).max(100).default(0)
});

const posCheckoutSchema = z.object({
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    customerId: z.string().optional(),
    customerName: z.string().trim().optional(),
    items: z.array(posItemSchema).min(1, 'At least one item is required'),
    paymentMethod: z.enum(['cash', 'card', 'upi', 'other']).default('cash'),
    amountPaid: z.number().min(0).optional(),
    notes: z.string().trim().optional()
});

module.exports = { posCheckoutSchema };
