const GRN = require('../models/GRN');
const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { createGRNSchema } = require('../validators/grnValidator');

const generateGRNNumber = async (tenantId) => {
    const year = new Date().getFullYear();
    const count = await GRN.countDocuments({ tenantId });
    const seq = String(count + 1).padStart(3, '0');
    return `GRN-${year}-${seq}`;
};

const createGRN = async (req, res, next) => {
    try {
        const data = createGRNSchema.parse(req.body);

        const po = await PurchaseOrder.findOne({
            _id: data.purchaseOrderId,
            tenantId: req.tenantId
        });
        if (!po) {
            return res.status(404).json({ success: false, error: 'Purchase order not found' });
        }

        if (po.status === 'draft' || po.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: `Cannot create GRN for a '${po.status}' purchase order. Confirm it first.`
            });
        }
        if (po.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Purchase order is already fully received'
            });
        }

        const grnNumber = await generateGRNNumber(req.tenantId);

        const grn = await GRN.create({
            tenantId: req.tenantId,
            grnNumber,
            purchaseOrderId: po._id,
            supplierId: po.supplierId,
            warehouseId: po.warehouseId,
            items: data.items,
            receivedDate: data.receivedDate || new Date(),
            notes: data.notes,
            receivedBy: req.userId
        });

        // ✅ Auto-update inventory + log stock movements for each item
        for (const item of data.items) {
            if (item.receivedQuantity > 0) {
                // Build batch update if batch info provided
                const batchUpdate = (item.batchNumber)
                    ? { $push: { batches: { batchNumber: item.batchNumber, expiryDate: item.expiryDate, quantity: item.receivedQuantity } } }
                    : {};

                await Inventory.findOneAndUpdate(
                    {
                        tenantId: req.tenantId,
                        warehouseId: po.warehouseId,
                        productId: item.productId,
                        variantId: item.variantId
                    },
                    {
                        $inc: { quantityOnHand: item.receivedQuantity },
                        $setOnInsert: {
                            tenantId: req.tenantId,
                            warehouseId: po.warehouseId,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantityReserved: 0,
                            reorderLevel: 0,
                            safetyStock: 0
                        },
                        ...batchUpdate
                    },
                    { upsert: true, new: true }
                );

                // ✅ Log stock movement
                await StockMovement.create({
                    tenantId: req.tenantId,
                    productId: item.productId,
                    variantId: item.variantId,
                    warehouseId: po.warehouseId,
                    movementType: 'IN',
                    referenceType: 'GRN',
                    referenceId: grn._id,
                    quantity: item.receivedQuantity,
                    date: data.receivedDate || new Date(),
                    createdBy: req.userId,
                    notes: `GRN: ${grnNumber}`
                });
            }
        }

        // Update PO status
        const totalOrdered = po.items.reduce((sum, i) => sum + i.quantity, 0);
        const totalReceived = data.items.reduce((sum, i) => sum + i.receivedQuantity, 0);

        po.status = totalReceived >= totalOrdered ? 'completed' : 'partially_received';
        await po.save();

        res.status(201).json({
            success: true,
            data: grn,
            message: `GRN created. Inventory updated. PO status: ${po.status}`
        });
    } catch (error) {
        next(error);
    }
};

const getGRNs = async (req, res, next) => {
    try {
        const { purchaseOrderId, supplierId } = req.query;
        const query = { tenantId: req.tenantId };

        if (purchaseOrderId) query.purchaseOrderId = purchaseOrderId;
        if (supplierId) query.supplierId = supplierId;

        const grns = await GRN.find(query)
            .populate('supplierId', 'name code')
            .populate('warehouseId', 'name code')
            .populate('purchaseOrderId', 'poNumber status')
            .populate('receivedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: grns.length, data: grns });
    } catch (error) {
        next(error);
    }
};

const getGRN = async (req, res, next) => {
    try {
        const grn = await GRN.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        })
            .populate('supplierId', 'name code contactPerson')
            .populate('warehouseId', 'name code address')
            .populate('purchaseOrderId', 'poNumber totalAmount')
            .populate('receivedBy', 'fullName email');

        if (!grn) {
            return res.status(404).json({ success: false, error: 'GRN not found' });
        }
        res.json({ success: true, data: grn });
    } catch (error) {
        next(error);
    }
};

module.exports = { createGRN, getGRNs, getGRN };
