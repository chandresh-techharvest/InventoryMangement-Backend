const Category = require('../models/Category');
const Product = require('../models/Product');
const ParentCategory = require('../models/ParentCategory');

// CREATE CATEGORY (subcategory)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, parentCategoryId, isActive } = req.body;

    // ✅ parentCategoryId REQUIRED now
    if (!parentCategoryId) {
      return res.status(400).json({
        success: false,
        error: "Parent category is required"
      });
    }

    // ✅ Verify parent exists in ParentCategory collection
    const parent = await ParentCategory.findOne({
      _id: parentCategoryId,
      tenantId: req.user.tenantId
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found"
      });
    }

    // ✅ Create subcategory
    const category = await Category.create({
      tenantId: req.user.tenantId,
      name,
      description,
      parentCategoryId,
      isActive: isActive ?? true
    });

    res.status(201).json({
      success: true,
      data: category
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Category already exists under this parent"
      });
    }
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { parentCategoryId, isActive } = req.query;

    const query = {
      tenantId: req.user.tenantId,
      parentCategoryId: { $ne: null }   // ✅ exclude old parent records
    };

    // filter by specific parent
    if (parentCategoryId && parentCategoryId !== "not-null") {
      query.parentCategoryId = parentCategoryId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const categories = await Category.find(query)
      .populate("parentCategoryId", "name")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    next(error);
  }
};

exports.getCategoryTree = async (req, res, next) => {
    try {
        // Get all categories for tenant
        const categories = await Category.find({
            tenantId: req.tenantId,
            isActive: true
        }).sort({ name: 1 });

        // Build tree structure
        const buildTree = (parentId = null) => {
            return categories
                .filter(cat => {
                    if (parentId === null) {
                        return cat.parentCategoryId === null || cat.parentCategoryId === undefined;
                    }
                    return cat.parentCategoryId && cat.parentCategoryId.toString() === parentId.toString();
                })
                .map(cat => ({
                    _id: cat._id,
                    name: cat.name,
                    description: cat.description,
                    children: buildTree(cat._id)
                }));
        };

        const tree = buildTree();

        res.json({
            success: true,
            data: tree
        });
    } catch (error) {
        next(error);
    }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate("parentCategoryId", "name");

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error("GET CATEGORY ERROR:", err);
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const { parentCategoryId, ...updateData } = req.body;

        // Find category
        let category = await Category.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // If updating parent, verify it exists and prevent circular reference
        if (parentCategoryId !== undefined) {
            if (parentCategoryId) {
                // Check if parent exists
                const parentCategory = await Category.findOne({
                    _id: parentCategoryId,
                    tenantId: req.tenantId
                });

                if (!parentCategory) {
                    return res.status(404).json({
                        success: false,
                        error: 'Parent category not found'
                    });
                }

                // Prevent setting self as parent
                if (parentCategoryId === req.params.id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Category cannot be its own parent'
                    });
                }
            }
            updateData.parentCategoryId = parentCategoryId || null;
        }

        // Update category
        category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('parentCategoryId', 'name');

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        // Handle duplicate category name
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Category name already exists at this level'
            });
        }
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if category has subcategories
        const subcategories = await Category.find({
            parentCategoryId: category._id,
            tenantId: req.tenantId
        });

        if (subcategories.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete category with subcategories'
            });
        }

        // Check if category has products
        const products = await Product.find({
            categoryId: category._id,
            tenantId: req.tenantId
        });

        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete category with products'
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
