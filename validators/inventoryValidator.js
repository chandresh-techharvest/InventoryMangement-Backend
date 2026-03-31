const { z } = require('zod');

const addStockSchema = z.object({
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).min(0, 'Quantity cannot be negative'),
    reorderLevel: z.number().min(0).default(0),
    safetyStock: z.number().min(0).default(0),
    batchNumber: z.string().trim().optional(),
    expiryDate: z.string().optional()
});

const updateStockSchema = z.object({
    quantityOnHand: z.number().min(0).optional(),
    quantityReserved: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    safetyStock: z.number().min(0).optional()
});

const transferStockSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    fromWarehouse: z.string().min(1, 'Source warehouse is required'),
    toWarehouse: z.string().min(1, 'Destination warehouse is required'),
    quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than zero'),
    notes: z.string().trim().max(500, 'Notes must be under 500 characters').optional().or(z.literal(''))
});

module.exports = { addStockSchema, updateStockSchema, transferStockSchema };
