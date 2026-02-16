const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    // Tenant isolation
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },

    // Category info
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
    },

    // Hierarchical structure
    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },

    description: {
        type: String,
        trim: true
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for tenant + name uniqueness at same level
categorySchema.index({ tenantId: 1, name: 1, parentCategoryId: 1 }, { unique: true });

// Method to get all subcategories
categorySchema.methods.getSubcategories = async function () {
    return await this.model('Category').find({
        tenantId: this.tenantId,
        parentCategoryId: this._id
    });
};

module.exports = mongoose.model('Category', categorySchema);
