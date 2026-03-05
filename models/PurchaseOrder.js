const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
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
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number
        }
    },
    { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true
        },
        poNumber: {
            type: String,
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
            type: [poItemSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: 'Purchase order must have at least one item'
            }
        },
        subtotal: {
            type: Number,
            default: 0
        },
        taxRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        taxAmount: {
            type: Number,
            default: 0
        },
        totalAmount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['draft', 'confirmed', 'partially_received', 'completed', 'cancelled'],
            default: 'draft'
        },
        orderDate: {
            type: Date,
            default: Date.now
        },
        expectedDeliveryDate: {
            type: Date
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// Unique PO number per tenant
purchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
