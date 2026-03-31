const { z } = require('zod');

const poItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
    unitPrice: z.number({ required_error: 'Unit price is required' }).min(0, 'Unit price cannot be negative'),
    taxRate: z.number({ required_error: 'Tax Rate is required' }).min(0, 'Tax Rate cannot be negative'),
});

const createPurchaseOrderSchema = z.object({
    supplierId: z.string().min(1, 'Supplier ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    items: z.array(poItemSchema).min(1, 'At least one item is required'),
    // taxRate: z.number().min(0).max(100).default(0),
    expectedDeliveryDate: z.string().optional(),
    notes: z.string().trim().optional()
});

const updatePOStatusSchema = z.object({
    status: z.enum(['confirmed', 'partially_received', 'completed', 'cancelled'])
});

module.exports = { createPurchaseOrderSchema, updatePOStatusSchema };
