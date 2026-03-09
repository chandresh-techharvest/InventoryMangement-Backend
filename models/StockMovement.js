const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
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
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        movementType: {
            type: String,
            enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'],
            required: true
        },
        referenceType: {
            type: String,
            enum: ['PO', 'GRN', 'SO', 'POS', 'TRANSFER', 'MANUAL'],
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// Indexes for fast querying
stockMovementSchema.index({ tenantId: 1, productId: 1, date: -1 });
stockMovementSchema.index({ tenantId: 1, warehouseId: 1, date: -1 });
stockMovementSchema.index({ tenantId: 1, referenceType: 1, referenceId: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
