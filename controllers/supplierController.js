const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplierValidator');

const createSupplier = async (req, res, next) => {
    try {
        const data = createSupplierSchema.parse(req.body);

        const existing = await Supplier.findOne({
            tenantId: req.tenantId,
            code: data.code
        });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Supplier code already exists' });
        }

        const supplier = await Supplier.create({ tenantId: req.tenantId, ...data });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

const getSuppliers = async (req, res, next) => {
    try {
        const { isActive, search } = req.query;
        const query = { tenantId: req.tenantId };

        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } }
            ];
        }

        const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
        next(error);
    }
};

const getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

const updateSupplier = async (req, res, next) => {
    try {
        const data = updateSupplierSchema.parse(req.body);

        if (data.code) {
            const existing = await Supplier.findOne({
                tenantId: req.tenantId,
                code: data.code,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Supplier code already exists' });
            }
        }

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            data,
            { new: true, runValidators: true }
        );
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

const deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        // Protect: cannot delete if POs exist
        const hasPO = await PurchaseOrder.findOne({ supplierId: supplier._id });
        if (hasPO) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete supplier with existing purchase orders'
            });
        }

        await supplier.deleteOne();
        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSupplier, getSuppliers, getSupplier, updateSupplier, deleteSupplier };
