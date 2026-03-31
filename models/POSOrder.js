const mongoose = require('mongoose');

const posItemSchema = new mongoose.Schema(
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

const posOrderSchema = new mongoose.Schema(
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
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        // Optional — walk-in customers may not have a record
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            default: null
        },
        customerName: {
            type: String,
            trim: true,
            default: 'Walk-in Customer'
        },
        items: {
            type: [posItemSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: 'POS order must have at least one item'
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
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'upi', 'other'],
            required: true,
            default: 'cash'
        },
        amountPaid: {
            type: Number,
            default: 0
        },
        changeReturned: {
            type: Number,
            default: 0
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

// Unique POS order number per tenant
posOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('POSOrder', posOrderSchema);
