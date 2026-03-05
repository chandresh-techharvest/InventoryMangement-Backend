const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        orderedQuantity: {
            type: Number,
            required: true,
            min: 0
        },
        receivedQuantity: {
            type: Number,
            required: true,
            min: 0
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: true }
);

const grnSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true
        },
        grnNumber: {
            type: String,
            required: true
        },
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            required: true
        },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        items: {
            type: [grnItemSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: 'GRN must have at least one item'
            }
        },
        receivedDate: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['completed'],
            default: 'completed'
        }
    },
    { timestamps: true }
);

// Unique GRN number per tenant
grnSchema.index({ tenantId: 1, grnNumber: 1 }, { unique: true });

module.exports = mongoose.model('GRN', grnSchema);
