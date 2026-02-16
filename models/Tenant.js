const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true
    },
    subdomain: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tenant', tenantSchema);
