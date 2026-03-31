const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
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
        contactPerson: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        },
        gstNumber: {
            type: String,
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
        paymentTerms: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Unique supplier code per tenant
supplierSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', supplierSchema);
