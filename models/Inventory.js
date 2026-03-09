const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        batchNumber: { type: String, required: true, trim: true },
        expiryDate: { type: Date },
        quantity: { type: Number, required: true, min: 0, default: 0 }
    },
    { _id: false }
);

const inventorySchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        quantityOnHand: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        quantityReserved: {
            type: Number,
            min: 0,
            default: 0
        },
        reorderLevel: {
            type: Number,
            min: 0,
            default: 0
        },
        safetyStock: {
            type: Number,
            min: 0,
            default: 0
        },
        batches: {
            type: [batchSchema],
            default: []
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// One inventory record per warehouse+product+variant per tenant
inventorySchema.index(
    { tenantId: 1, warehouseId: 1, productId: 1, variantId: 1 },
    { unique: true }
);

// Virtual: available qty = onHand - reserved
inventorySchema.virtual('availableQuantity').get(function () {
    return this.quantityOnHand - this.quantityReserved;
});

// Virtual: is low stock?
inventorySchema.virtual('isLowStock').get(function () {
    return this.quantityOnHand <= this.reorderLevel && this.reorderLevel > 0;
});

module.exports = mongoose.model('Inventory', inventorySchema);
