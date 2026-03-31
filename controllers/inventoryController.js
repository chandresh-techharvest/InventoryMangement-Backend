const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { addStockSchema, updateStockSchema } = require('../validators/inventoryValidator');

const addStock = async (req, res, next) => {
    try {
        const data = addStockSchema.parse(req.body);
        const { warehouseId, productId, variantId, quantity, reorderLevel, safetyStock, batchNumber, expiryDate } = data;

        const warehouse = await Warehouse.findOne({ _id: warehouseId, tenantId: req.tenantId });
        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        const product = await Product.findOne({ _id: productId, tenantId: req.tenantId });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ success: false, error: 'Variant not found on this product' });
        }

        // Build batch push if provided
        const batchUpdate = (batchNumber && quantity > 0)
            ? { $push: { batches: { batchNumber, expiryDate, quantity } } }
            : {};

        const inventory = await Inventory.findOneAndUpdate(
            { tenantId: req.tenantId, warehouseId, productId, variantId },
            {
                $set: {
                    tenantId: req.tenantId,
                    warehouseId,
                    productId,
                    variantId,
                    reorderLevel: reorderLevel ?? 0,
                    safetyStock: safetyStock ?? 0
                },
                $inc: { quantityOnHand: quantity },
                ...batchUpdate
            },
            { new: true, upsert: true, runValidators: true }
        );

        // Log stock movement (MANUAL adjustment)
        await StockMovement.create({
            tenantId: req.tenantId,
            productId,
            variantId,
            warehouseId,
            movementType: 'IN',
            referenceType: 'MANUAL',
            referenceId: inventory._id,
            quantity,
            createdBy: req.userId,
            notes: 'Manual stock addition'
        });

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
        const allInventory = await Inventory.find({
            tenantId: req.tenantId,
            reorderLevel: { $gt: 0 }
        })
            .populate('warehouseId', 'name code')
            .populate('productId', 'name sku');

        const lowStockItems = allInventory.filter(item => item.isLowStock);
        res.json({ success: true, count: lowStockItems.length, data: lowStockItems });
    } catch (error) {
        next(error);
    }
};

const getTotalStock = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findOne({ _id: productId, tenantId: req.tenantId });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const inventoryRecords = await Inventory.find({
            tenantId: req.tenantId,
            productId
        }).populate('warehouseId', 'name code');

        const totalQuantity = inventoryRecords.reduce((sum, r) => sum + r.quantityOnHand, 0);
        const totalAvailable = inventoryRecords.reduce((sum, r) => sum + r.availableQuantity, 0);
        const totalReserved = inventoryRecords.reduce((sum, r) => sum + r.quantityReserved, 0);

        const breakdown = inventoryRecords.map(r => ({
            warehouse: r.warehouseId,
            variantId: r.variantId,
            quantityOnHand: r.quantityOnHand,
            availableQuantity: r.availableQuantity,
            quantityReserved: r.quantityReserved,
            safetyStock: r.safetyStock,
            isLowStock: r.isLowStock,
            batches: r.batches
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

const getStockMovements = async (req, res, next) => {
    try {
        const { productId, warehouseId, movementType } = req.query;
        const query = { tenantId: req.tenantId };

        if (productId) query.productId = productId;
        if (warehouseId) query.warehouseId = warehouseId;
        if (movementType) query.movementType = movementType;

        const movements = await StockMovement.find(query)
            .populate('productId', 'name sku')
            .populate('warehouseId', 'name code')
            .populate('createdBy', 'fullName email')
            .sort({ date: -1 })
            .limit(100);

        res.json({ success: true, count: movements.length, data: movements });
    } catch (error) {
        next(error);
    }
};

module.exports = { addStock, getInventory, getInventoryById, updateStock, getLowStock, getTotalStock, getStockMovements };
