const Product = require("../models/Product");
const Category = require("../models/Category");
const ParentCategory = require("../models/ParentCategory");

// ================= CREATE =================
exports.createProduct = async (req, res, next) => {
  try {
    if (req.body.supplierId === "") {
      req.body.supplierId = null;
    }

    const { parentCategoryId, categoryId, ...productData } = req.body;

    if (!parentCategoryId) {
      return res.status(400).json({
        success: false,
        error: "Parent category is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: "Category is required",
      });
    }

    // verify parent exists
    const parent = await ParentCategory.findOne({
      _id: parentCategoryId,
      tenantId: req.tenantId,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found",
      });
    }

    // verify category belongs to parent
    const category = await Category.findOne({
      _id: categoryId,
      tenantId: req.tenantId,
      parentCategoryId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not under selected parent",
      });
    }

    // SKU unique
    const existingProduct = await Product.findOne({
      tenantId: req.tenantId,
      sku: productData.sku,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: "SKU already exists",
      });
    }

    const product = await Product.create({
      ...productData,
      tenantId: req.tenantId,
      parentCategoryId,
      categoryId,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET LIST =================
exports.getProducts = async (req, res, next) => {
  try {
    const { parentCategoryId, categoryId, isActive, search } = req.query;

    const query = { tenantId: req.tenantId };

    if (parentCategoryId) query.parentCategoryId = parentCategoryId;
    if (categoryId) query.categoryId = categoryId;

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.stock === "in") query.stock = { $gt: 0 };
    if (req.query.stock === "out") query.stock = { $lte: 0 };

    const products = await Product.find(query)
      .populate("parentCategoryId", "name")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ONE =================
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    })
      .populate("parentCategoryId", "name")
      .populate("categoryId", "name parentCategoryId");

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE =================
exports.updateProduct = async (req, res, next) => {
  try {
    const { parentCategoryId, categoryId, sku, ...updateData } = req.body;

    let product = await Product.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // validate parent+category pair
    if (parentCategoryId && categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        tenantId: req.tenantId,
        parentCategoryId,
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: "Category not under parent",
        });
      }

      updateData.parentCategoryId = parentCategoryId;
      updateData.categoryId = categoryId;
    }

    // SKU unique
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        tenantId: req.tenantId,
        sku,
        _id: { $ne: product._id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: "SKU already exists",
        });
      }

      updateData.sku = sku;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("parentCategoryId", "name")
      .populate("categoryId", "name");

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE =================
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};