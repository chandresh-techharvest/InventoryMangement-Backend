const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { addStockSchema, updateStockSchema, transferStockSchema } = require('../validators/inventoryValidator');

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

        const oldInventory = await Inventory.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!oldInventory) {
            return res.status(404).json({ success: false, error: 'Inventory record not found' });
        }

        const updated = await Inventory.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            data,
            { new: true, runValidators: true }
        );

        const diff = updated.quantityOnHand - oldInventory.quantityOnHand;

        if (diff !== 0) {
            await StockMovement.create({
                tenantId: req.tenantId,
                productId: updated.productId,
                variantId: updated.variantId,
                warehouseId: updated.warehouseId,
                movementType: 'ADJUSTMENT',
                referenceType: 'MANUAL',
                referenceId: updated._id,
                quantity: diff,
                createdBy: req.userId,
                notes: 'Manual stock adjustment'
            });
        }

        res.json({ success: true, data: updated });
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
            .populate('counterpartyWarehouseId', 'name code')
            .populate('createdBy', 'fullName email')
            .sort({ date: -1 })
            .limit(100);

        res.json({ success: true, count: movements.length, data: movements });
    } catch (error) {
        next(error);
    }
};

const transferStock = async (req, res, next) => {
    try {
        const data = transferStockSchema.parse(req.body);
        const {
            productId,
            variantId,
            fromWarehouse,
            toWarehouse,
            quantity,
            notes
        } = data;

        if (fromWarehouse === toWarehouse) {
            return res.status(400).json({ success: false, error: 'Cannot transfer to same warehouse' });
        }

        const [product, sourceWarehouse, destinationWarehouse] = await Promise.all([
            Product.findOne({ _id: productId, tenantId: req.tenantId }),
            Warehouse.findOne({ _id: fromWarehouse, tenantId: req.tenantId }),
            Warehouse.findOne({ _id: toWarehouse, tenantId: req.tenantId })
        ]);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ success: false, error: 'Variant not found on this product' });
        }

        if (!sourceWarehouse || !destinationWarehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        if (!sourceWarehouse.isActive) {
            return res.status(400).json({ success: false, error: 'Source warehouse is inactive' });
        }

        if (!destinationWarehouse.isActive) {
            return res.status(400).json({ success: false, error: 'Destination warehouse is inactive' });
        }

        const transferGroupId = new Inventory()._id;
        let sourceInventoryId;
        let destinationInventoryId;
        let sourceRemaining = 0;
        let destinationBalance = 0;

        const fromInv = await Inventory.findOne({
            tenantId: req.tenantId,
            productId,
            variantId,
            warehouseId: fromWarehouse
        });

        if (!fromInv) {
            return res.status(404).json({ success: false, error: 'Source inventory record not found' });
        }

        if (fromInv.availableQuantity < quantity) {
            return res.status(400).json({ success: false, error: `Only ${fromInv.availableQuantity} units are available in the source warehouse` });
        }

        fromInv.quantityOnHand -= quantity;
        await fromInv.save();

        const toInv = await Inventory.findOneAndUpdate(
            {
                tenantId: req.tenantId,
                productId,
                variantId,
                warehouseId: toWarehouse
            },
            {
                $setOnInsert: {
                    tenantId: req.tenantId,
                    warehouseId: toWarehouse,
                    productId,
                    variantId,
                    reorderLevel: 0,
                    safetyStock: 0,
                    quantityReserved: 0
                },
                $inc: { quantityOnHand: quantity }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        sourceInventoryId = fromInv._id;
        destinationInventoryId = toInv._id;
        sourceRemaining = fromInv.availableQuantity;
        destinationBalance = toInv.availableQuantity;

        const auditNote = notes?.trim();

        await StockMovement.create([
            {
                tenantId: req.tenantId,
                productId,
                variantId,
                warehouseId: fromWarehouse,
                counterpartyWarehouseId: toWarehouse,
                movementType: 'TRANSFER',
                referenceType: 'TRANSFER',
                referenceId: fromInv._id,
                transferGroupId,
                quantity: -quantity,
                createdBy: req.userId,
                notes: auditNote || `Transfer out to ${destinationWarehouse.name}`
            },
            {
                tenantId: req.tenantId,
                productId,
                variantId,
                warehouseId: toWarehouse,
                counterpartyWarehouseId: fromWarehouse,
                movementType: 'TRANSFER',
                referenceType: 'TRANSFER',
                referenceId: toInv._id,
                transferGroupId,
                quantity,
                createdBy: req.userId,
                notes: auditNote || `Transfer in from ${sourceWarehouse.name}`
            }
        ]);

        res.json({
            success: true,
            message: 'Stock transferred successfully',
            data: {
                transferGroupId,
                quantity,
                notes: notes?.trim() || '',
                product: {
                    id: product._id,
                    name: product.name,
                    sku: product.sku
                },
                variant: {
                    id: variant._id,
                    attributes: Object.fromEntries(variant.attributes || [])
                },
                sourceWarehouse: {
                    id: sourceWarehouse._id,
                    name: sourceWarehouse.name,
                    inventoryId: sourceInventoryId,
                    remainingAvailableQuantity: sourceRemaining
                },
                destinationWarehouse: {
                    id: destinationWarehouse._id,
                    name: destinationWarehouse.name,
                    inventoryId: destinationInventoryId,
                    availableQuantity: destinationBalance
                },
                transferredAt: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const {
            inventoryId,
            adjustmentType,
            quantity,
            reason
        } = req.body;

        const inventory = await Inventory.findOne({
            _id: inventoryId,
            tenantId: req.tenantId
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: 'Inventory not found'
            });
        }

        const change = adjustmentType === 'OUT' ? -quantity : quantity;

        inventory.quantityOnHand += change;

        if (inventory.quantityOnHand < 0) {
            return res.status(400).json({
                success: false,
                error: 'Stock cannot be negative'
            });
        }

        await inventory.save();

        await StockMovement.create({
            tenantId: req.tenantId,
            productId: inventory.productId,
            variantId: inventory.variantId,
            warehouseId: inventory.warehouseId,
            movementType: 'ADJUSTMENT',
            referenceType: 'MANUAL',
            referenceId: inventory._id,
            quantity,
            createdBy: req.userId,
            notes: reason || 'Stock adjustment'
        });

        res.json({
            success: true,
            message: 'Stock adjusted successfully',
            data: inventory
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { addStock, getInventory, getInventoryById, updateStock, getLowStock, getTotalStock, getStockMovements, transferStock, adjustStock };
