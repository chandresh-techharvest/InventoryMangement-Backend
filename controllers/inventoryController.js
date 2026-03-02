const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { addStockSchema, updateStockSchema } = require('../validators/inventoryValidator');

const addStock = async (req, res, next) => {
    try {
        const data = addStockSchema.parse(req.body);
        const { warehouseId, productId, variantId, quantity, reorderLevel, batchNumber, expiryDate } = data;

        // Validate warehouse belongs to tenant
        const warehouse = await Warehouse.findOne({ _id: warehouseId, tenantId: req.tenantId });
        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        // Validate product belongs to tenant
        const product = await Product.findOne({ _id: productId, tenantId: req.tenantId });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Validate variant exists on product
        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ success: false, error: 'Variant not found on this product' });
        }

        // Upsert: update if exists, create if not
        const inventory = await Inventory.findOneAndUpdate(
            { tenantId: req.tenantId, warehouseId, productId, variantId },
            {
                $set: {
                    tenantId: req.tenantId,
                    warehouseId,
                    productId,
                    variantId,
                    reorderLevel: reorderLevel ?? 0,
                    ...(batchNumber && { batchNumber }),
                    ...(expiryDate && { expiryDate })
                },
                $inc: { quantity }
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

const getInventory = async (req, res, next) => {
    try {
        const { warehouseId, productId, lowStock } = req.query;
        const query = { tenantId: req.tenantId };

        if (warehouseId) query.warehouseId = warehouseId;
        if (productId) query.productId = productId;

        let inventory = await Inventory.find(query)
            .populate('warehouseId', 'name code')
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 });

        // Filter low stock via virtual
        if (lowStock === 'true') {
            inventory = inventory.filter(item => item.isLowStock);
        }

        res.json({ success: true, count: inventory.length, data: inventory });
    } catch (error) {
        next(error);
    }
};

const getInventoryById = async (req, res, next) => {
    try {
        const inventory = await Inventory.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        })
            .populate('warehouseId', 'name code address')
            .populate('productId', 'name sku uom');

        if (!inventory) {
            return res.status(404).json({ success: false, error: 'Inventory record not found' });
        }

        res.json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

const updateStock = async (req, res, next) => {
    try {
        const data = updateStockSchema.parse(req.body);

        const inventory = await Inventory.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            data,
            { new: true, runValidators: true }
        );

        if (!inventory) {
            return res.status(404).json({ success: false, error: 'Inventory record not found' });
        }

        res.json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

const getLowStock = async (req, res, next) => {
    try {
        // Get all records where reorderLevel is set (> 0), populated
        const allInventory = await Inventory.find({
            tenantId: req.tenantId,
            reorderLevel: { $gt: 0 }
        })
            .populate('warehouseId', 'name code')
            .populate('productId', 'name sku');

        // Filter via virtual
        const lowStockItems = allInventory.filter(item => item.isLowStock);

        res.json({ success: true, count: lowStockItems.length, data: lowStockItems });
    } catch (error) {
        next(error);
    }
};

const getTotalStock = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Validate product belongs to tenant
        const product = await Product.findOne({ _id: productId, tenantId: req.tenantId });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const inventoryRecords = await Inventory.find({
            tenantId: req.tenantId,
            productId
        }).populate('warehouseId', 'name code');

        // Aggregate totals
        const totalQuantity = inventoryRecords.reduce((sum, r) => sum + r.quantity, 0);
        const totalAvailable = inventoryRecords.reduce((sum, r) => sum + r.availableQuantity, 0);
        const totalReserved = inventoryRecords.reduce((sum, r) => sum + r.reservedQuantity, 0);

        const breakdown = inventoryRecords.map(r => ({
            warehouse: r.warehouseId,
            variantId: r.variantId,
            quantity: r.quantity,
            availableQuantity: r.availableQuantity,
            reservedQuantity: r.reservedQuantity,
            isLowStock: r.isLowStock
        }));

        res.json({
            success: true,
            data: {
                product: { id: product._id, name: product.name, sku: product.sku },
                totalQuantity,
                totalAvailable,
                totalReserved,
                breakdown
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { addStock, getInventory, getInventoryById, updateStock, getLowStock, getTotalStock };
