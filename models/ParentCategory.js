const mongoose = require("mongoose");

const parentCategorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: [true, "Parent category name is required"],
      trim: true
    },

    description: {
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

// unique per tenant
parentCategorySchema.index(
  { tenantId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("ParentCategory", parentCategorySchema);