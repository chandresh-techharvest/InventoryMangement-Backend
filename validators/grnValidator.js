const { z } = require('zod');

const grnItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    orderedQuantity: z.number().min(0),
    receivedQuantity: z.number({ required_error: 'Received quantity is required' }).min(0),
    unitPrice: z.number().min(0),
    batchNumber: z.string().trim().optional(),
    expiryDate: z.string().optional()
});

const createGRNSchema = z.object({
    purchaseOrderId: z.string().min(1, 'Purchase Order ID is required'),
    items: z.array(grnItemSchema).min(1, 'At least one item is required'),
    receivedDate: z.string().optional(),
    notes: z.string().trim().optional()
});

module.exports = { createGRNSchema };
