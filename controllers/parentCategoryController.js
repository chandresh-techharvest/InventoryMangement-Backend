const ParentCategory = require("../models/ParentCategory");
const Category = require("../models/Category");

// GET all parent categories
exports.getParentCategories = async (req, res, next) => {
  try {
    const parents = await ParentCategory.find({
      tenantId: req.user.tenantId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: parents
    });
  } catch (err) {
    next(err);
  }
};

// CREATE parent category
exports.createParentCategory = async (req, res, next) => {
  try {
    const parent = await ParentCategory.create({
      tenantId: req.user.tenantId,
      name: req.body.name,
      description: req.body.description
    });

    res.status(201).json({
      success: true,
      data: parent
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Parent category already exists"
      });
    }
    next(err);
  }
};

// GET single parent
exports.getParentCategory = async (req, res, next) => {
  try {
    const parent = await ParentCategory.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found"
      });
    }

    res.json({
      success: true,
      data: parent
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE parent
exports.updateParentCategory = async (req, res, next) => {
  try {
    const parent = await ParentCategory.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId
      },
      {
        name: req.body.name,
        description: req.body.description
      },
      { new: true }
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found"
      });
    }

    res.json({
      success: true,
      data: parent
    });
  } catch (err) {
    next(err);
  }
};

// DELETE parent
exports.deleteParentCategory = async (req, res, next) => {
  try {
    // check subcategories exist
    const subExists = await Category.exists({
      tenantId: req.user.tenantId,
      parentCategoryId: req.params.id
    });

    if (subExists) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete parent category with subcategories"
      });
    }

    const parent = await ParentCategory.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found"
      });
    }

    res.json({
      success: true,
      message: "Parent category deleted"
    });
  } catch (err) {
    next(err);
  }
};