const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { createPurchaseOrderSchema, updatePOStatusSchema } = require('../validators/purchaseOrderValidator');

// Helper: generate PO number e.g. PO-2025-001
const generatePONumber = async (tenantId) => {
    const year = new Date().getFullYear();
    const count = await PurchaseOrder.countDocuments({ tenantId });
    const seq = String(count + 1).padStart(3, '0');
    return `PO-${year}-${seq}`;
};

const createPurchaseOrder = async (req, res, next) => {
    try {
        const data = createPurchaseOrderSchema.parse(req.body);

        // Validate supplier
        const supplier = await Supplier.findOne({ _id: data.supplierId, tenantId: req.tenantId });
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        // Validate warehouse
        const warehouse = await Warehouse.findOne({ _id: data.warehouseId, tenantId: req.tenantId });
        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        // Validate all products and variants, calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of data.items) {
            const product = await Product.findOne({ _id: item.productId, tenantId: req.tenantId });
            if (!product) {
                return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
            }
            const variant = product.variants.id(item.variantId);
            if (!variant) {
                return res.status(404).json({ success: false, error: `Variant not found: ${item.variantId}` });
            }

            const totalPrice = item.quantity * item.unitPrice;
            subtotal += totalPrice;
            processedItems.push({ ...item, totalPrice });
        }

        const taxAmount = (subtotal * (data.taxRate || 0)) / 100;
        const totalAmount = subtotal + taxAmount;
        const poNumber = await generatePONumber(req.tenantId);

        const po = await PurchaseOrder.create({
            tenantId: req.tenantId,
            poNumber,
            supplierId: data.supplierId,
            warehouseId: data.warehouseId,
            items: processedItems,
            subtotal,
            taxRate: data.taxRate || 0,
            taxAmount,
            totalAmount,
            expectedDeliveryDate: data.expectedDeliveryDate,
            notes: data.notes
        });

        res.status(201).json({ success: true, data: po });
    } catch (error) {
        next(error);
    }
};

const getPurchaseOrders = async (req, res, next) => {
    try {
        const { status, supplierId } = req.query;
        const query = { tenantId: req.tenantId };

        if (status) query.status = status;
        if (supplierId) query.supplierId = supplierId;

        const orders = await PurchaseOrder.find(query)
            .populate('supplierId', 'name code')
            .populate('warehouseId', 'name code')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

const getPurchaseOrder = async (req, res, next) => {
    try {
        const po = await PurchaseOrder.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        })
            .populate('supplierId', 'name code contactPerson phone')
            .populate('warehouseId', 'name code address');

        if (!po) {
            return res.status(404).json({ success: false, error: 'Purchase order not found' });
        }
        res.json({ success: true, data: po });
    } catch (error) {
        next(error);
    }
};

const updatePOStatus = async (req, res, next) => {
    try {
        const { status } = updatePOStatusSchema.parse(req.body);

        const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
        if (!po) {
            return res.status(404).json({ success: false, error: 'Purchase order not found' });
        }

        // Only draft POs can be confirmed or cancelled
        if (po.status !== 'draft') {
            return res.status(400).json({
                success: false,
                error: `Cannot update status. Current status is '${po.status}'`
            });
        }

        po.status = status;
        await po.save();

        res.json({ success: true, data: po });
    } catch (error) {
        next(error);
    }
};

module.exports = { createPurchaseOrder, getPurchaseOrders, getPurchaseOrder, updatePOStatus };
