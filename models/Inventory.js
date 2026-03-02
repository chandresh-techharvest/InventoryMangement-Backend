const mongoose = require('mongoose');

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
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        reservedQuantity: {
            type: Number,
            min: 0,
            default: 0
        },
        reorderLevel: {
            type: Number,
            min: 0,
            default: 0
        },
        batchNumber: {
            type: String,
            trim: true
        },
        expiryDate: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// One inventory record per warehouse+product+variant combo per tenant
inventorySchema.index(
    { tenantId: 1, warehouseId: 1, productId: 1, variantId: 1 },
    { unique: true }
);

// Virtual: available qty = total - reserved
inventorySchema.virtual('availableQuantity').get(function () {
    return this.quantity - this.reservedQuantity;
});

// Virtual: is low stock?
inventorySchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.reorderLevel && this.reorderLevel > 0;
});

module.exports = mongoose.model('Inventory', inventorySchema);
