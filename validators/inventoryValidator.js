const { z } = require('zod');

const addStockSchema = z.object({
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).min(0, 'Quantity cannot be negative'),
    reorderLevel: z.number().min(0).default(0),
    batchNumber: z.string().trim().optional(),
    expiryDate: z.string().datetime({ offset: true }).optional().or(z.string().optional())
});

const updateStockSchema = z.object({
    quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
    reservedQuantity: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    batchNumber: z.string().trim().optional(),
    expiryDate: z.string().optional()
});

module.exports = { addStockSchema, updateStockSchema };
