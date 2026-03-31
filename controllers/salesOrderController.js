const SalesOrder = require('../models/SalesOrder');
const Customer = require('../models/Customer');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { createSalesOrderSchema, updateSOStatusSchema } = require('../validators/salesOrderValidator');

// Helper: auto-generate SO number e.g. SO-2025-001
const generateSONumber = async (tenantId) => {
    const year = new Date().getFullYear();
    const count = await SalesOrder.countDocuments({ tenantId });
    const seq = String(count + 1).padStart(3, '0');
    return `SO-${year}-${seq}`;
};

const createSalesOrder = async (req, res, next) => {
    try {
        const data = createSalesOrderSchema.parse(req.body);

        // Validate customer
        const customer = await Customer.findOne({ _id: data.customerId, tenantId: req.tenantId });
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Validate warehouse
        const warehouse = await Warehouse.findOne({ _id: data.warehouseId, tenantId: req.tenantId });
        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        // Validate all products/variants and calculate totals
        let subtotal = 0;
        let taxAmount = 0;
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

            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * (item.tax || 0)) / 100;
            subtotal += itemTotal;
            taxAmount += itemTax;

            processedItems.push({ ...item, totalPrice: itemTotal });
        }

        const orderNumber = await generateSONumber(req.tenantId);

        const so = await SalesOrder.create({
            tenantId: req.tenantId,
            orderNumber,
            customerId: data.customerId,
            warehouseId: data.warehouseId,
            items: processedItems,
            subtotal,
            taxAmount,
            totalAmount: subtotal + taxAmount,
            notes: data.notes,
            createdBy: req.userId
        });

        res.status(201).json({ success: true, data: so });
    } catch (error) {
        next(error);
    }
};

const getSalesOrders = async (req, res, next) => {
    try {
        const { status, customerId } = req.query;
        const query = { tenantId: req.tenantId };

        if (status) query.status = status;
        if (customerId) query.customerId = customerId;

        const orders = await SalesOrder.find(query)
            .populate('customerId', 'name code phone')
            .populate('warehouseId', 'name code')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

const getSalesOrder = async (req, res, next) => {
    try {
        const so = await SalesOrder.findOne({ _id: req.params.id, tenantId: req.tenantId })
            .populate('customerId', 'name code phone email address')
            .populate('warehouseId', 'name code address')
            .populate('createdBy', 'fullName email');

        if (!so) {
            return res.status(404).json({ success: false, error: 'Sales order not found' });
        }
        res.json({ success: true, data: so });
    } catch (error) {
        next(error);
    }
};

const updateSOStatus = async (req, res, next) => {
    try {
        const { status } = updateSOStatusSchema.parse(req.body);

        const so = await SalesOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
        if (!so) {
            return res.status(404).json({ success: false, error: 'Sales order not found' });
        }

        // Status transition rules
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['fulfilled', 'cancelled'],
            fulfilled: [],
            cancelled: []
        };

        if (!validTransitions[so.status].includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot move from '${so.status}' to '${status}'`
            });
        }

        // ✅ ON CONFIRM → Reserve stock (check availability first)
        if (status === 'confirmed') {
            for (const item of so.items) {
                const inventory = await Inventory.findOne({
                    tenantId: req.tenantId,
                    warehouseId: so.warehouseId,
                    productId: item.productId,
                    variantId: item.variantId
                });

                if (!inventory) {
                    return res.status(400).json({
                        success: false,
                        error: `No inventory found for product ${item.productId} in this warehouse`
                    });
                }

                const available = inventory.quantityOnHand - inventory.quantityReserved;
                if (item.quantity > available) {
                    return res.status(400).json({
                        success: false,
                        error: `Insufficient stock. Available: ${available}, Requested: ${item.quantity}`
                    });
                }

                // Reserve the stock
                await Inventory.findOneAndUpdate(
                    { _id: inventory._id },
                    { $inc: { quantityReserved: item.quantity } }
                );
            }
        }

        // ✅ ON FULFIL → Decrease stock + log OUT movements
        if (status === 'fulfilled') {
            for (const item of so.items) {
                await Inventory.findOneAndUpdate(
                    {
                        tenantId: req.tenantId,
                        warehouseId: so.warehouseId,
                        productId: item.productId,
                        variantId: item.variantId
                    },
                    {
                        $inc: {
                            quantityOnHand: -item.quantity,
                            quantityReserved: -item.quantity
                        }
                    }
                );

                // Log stock movement OUT
                await StockMovement.create({
                    tenantId: req.tenantId,
                    productId: item.productId,
                    variantId: item.variantId,
                    warehouseId: so.warehouseId,
                    movementType: 'OUT',
                    referenceType: 'SO',
                    referenceId: so._id,
                    quantity: -item.quantity,
                    date: new Date(),
                    createdBy: req.userId,
                    notes: `Sales Order: ${so.orderNumber}`
                });
            }
        }

        // ✅ ON CANCEL → Release reserved stock (only if was confirmed)
        if (status === 'cancelled' && so.status === 'confirmed') {
            for (const item of so.items) {
                await Inventory.findOneAndUpdate(
                    {
                        tenantId: req.tenantId,
                        warehouseId: so.warehouseId,
                        productId: item.productId,
                        variantId: item.variantId
                    },
                    { $inc: { quantityReserved: -item.quantity } }
                );
            }
        }

        so.status = status;
        await so.save();

        res.json({
            success: true,
            data: so,
            message: `Sales order ${status} successfully`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSalesOrder, getSalesOrders, getSalesOrder, updateSOStatus };
