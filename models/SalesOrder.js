const mongoose = require('mongoose');

const soItemSchema = new mongoose.Schema(
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
        tax: {
            type: Number,
            min: 0,
            default: 0
        },
        totalPrice: {
            type: Number
        }
    },
    { _id: true }
);

const salesOrderSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true
        },
        orderNumber: {
            type: String,
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        items: {
            type: [soItemSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: 'Sales order must have at least one item'
            }
        },
        subtotal: {
            type: Number,
            default: 0
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
            enum: ['pending', 'confirmed', 'fulfilled', 'cancelled'],
            default: 'pending'
        },
        orderDate: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

// Unique SO number per tenant
salesOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
