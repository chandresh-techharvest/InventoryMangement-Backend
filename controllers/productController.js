const Product = require('../models/Product');
const Category = require('../models/Category');

exports.createProduct = async (req, res, next) => {
    try {
        const { categoryId, ...productData } = req.body;

        // Verify category exists and belongs to tenant
        const category = await Category.findOne({
            _id: categoryId,
            tenantId: req.tenantId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if SKU already exists for this tenant
        const existingProduct = await Product.findOne({
            tenantId: req.tenantId,
            sku: productData.sku
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                error: 'SKU already exists'
            });
        }

        // Create product
        const product = await Product.create({
            ...productData,
            categoryId,
            tenantId: req.tenantId
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const { categoryId, isActive, search } = req.query;

        // Build query
        const query = { tenantId: req.tenantId };

        if (categoryId) {
            query.categoryId = categoryId;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        }).populate('categoryId', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { categoryId, sku, ...updateData } = req.body;

        // Find product
        let product = await Product.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // If updating category, verify it exists
        if (categoryId) {
            const category = await Category.findOne({
                _id: categoryId,
                tenantId: req.tenantId
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }
            updateData.categoryId = categoryId;
        }

        // If updating SKU, check uniqueness
        if (sku && sku !== product.sku) {
            const existingProduct = await Product.findOne({
                tenantId: req.tenantId,
                sku,
                _id: { $ne: product._id }
            });

            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    error: 'SKU already exists'
                });
            }
            updateData.sku = sku;
        }

        // Update product
        product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name');

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
