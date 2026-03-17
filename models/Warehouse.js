const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
            country: { type: String, trim: true, default: 'India' }
        },
        contactPerson: {
            type: String,
            trim: true
        },
        contactPhone: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        parentCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParentCategory',
            default: null
        }
    },
    { timestamps: true }
);

// Unique warehouse code per tenant
warehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
