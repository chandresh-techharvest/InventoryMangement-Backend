const Warehouse = require('../models/Warehouse');
// const Inventory = require('../models/Inventory');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/warehouseValidator');

const createWarehouse = async (req, res, next) => {
    try {
        const data = createWarehouseSchema.parse(req.body);

        const existing = await Warehouse.findOne({
            tenantId: req.tenantId,
            code: data.code
        });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Warehouse code already exists' });
        }

        const warehouse = await Warehouse.create({
            tenantId: req.tenantId,
            ...data
        });

        res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

const getWarehouses = async (req, res, next) => {
    try {
        const { isActive, search } = req.query;
        const query = { tenantId: req.tenantId };

        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const warehouses = await Warehouse.find(query).populate('parentCategoryId', 'name').sort({ createdAt: -1 });
        res.json({ success: true, count: warehouses.length, data: warehouses });
    } catch (error) {
        next(error);
    }
};

const getWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        }).populate('parentCategoryId', 'name');

        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        res.json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

const updateWarehouse = async (req, res, next) => {
    try {
        const data = updateWarehouseSchema.parse(req.body);

        // Check code uniqueness if updating code
        if (data.code) {
            const existing = await Warehouse.findOne({
                tenantId: req.tenantId,
                code: data.code,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Warehouse code already exists' });
            }
        }

        const warehouse = await Warehouse.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            data,
            { new: true, runValidators: true }
        );

        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        res.json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

const deleteWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        // Protect: cannot delete if inventory exists
        // const hasInventory = await Inventory.findOne({ warehouseId: warehouse._id });
        // if (hasInventory) {
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Cannot delete warehouse with existing inventory. Remove stock first.'
        //     });
        // }

        await warehouse.deleteOne();
        res.json({ success: true, message: 'Warehouse deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createWarehouse, getWarehouses, getWarehouse, updateWarehouse, deleteWarehouse };
