const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Tenant isolation
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },

    // Product identification
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        trim: true,
        uppercase: true
    },

    barcode: {
        type: String,
        trim: true
    },

    // Basic info
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParentCategory",
        required: true,
        index: true
    },

    // Category
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
        index: true
    },

    brand: {
        type: String,
        trim: true
    },

    // Unit of Measure
    uom: {
        type: String,
        required: [true, 'Unit of measure is required'],
        enum: ['PCS', 'KG', 'L', 'M', 'BOX', 'DOZEN'],
        default: 'PCS'
    },

    // Variants (color, size, etc.)
    variants: [{
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        attributes: {
            type: Map,
            of: String
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        cost: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    // Tax
    taxRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for tenant + SKU uniqueness
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });

// Compound index for tenant + barcode
productSchema.index({ tenantId: 1, barcode: 1 });

module.exports = mongoose.model('Product', productSchema);
