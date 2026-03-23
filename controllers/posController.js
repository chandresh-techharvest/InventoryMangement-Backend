const POSOrder = require('../models/POSOrder');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { posCheckoutSchema } = require('../validators/posValidator');

// Auto-generate POS order number e.g. POS-2026-001
const generatePOSNumber = async (tenantId) => {
    const year = new Date().getFullYear();
    const count = await POSOrder.countDocuments({ tenantId });
    const seq = String(count + 1).padStart(3, '0');
    return `POS-${year}-${seq}`;
};

// ─── POST /api/pos/checkout ───────────────────────────────────────────────────
// One-shot: validate stock → create POSOrder → decrease inventory → log movements
const checkout = async (req, res, next) => {
    try {
        const data = posCheckoutSchema.parse(req.body);

        // Validate warehouse
        const warehouse = await Warehouse.findOne({ _id: data.warehouseId, tenantId: req.tenantId });
        if (!warehouse) {
            return res.status(404).json({ success: false, error: 'Warehouse not found' });
        }

        // Validate all items, check stock, calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        const processedItems = [];

        for (const item of data.items) {
            // Validate product + variant
            const product = await Product.findOne({ _id: item.productId, tenantId: req.tenantId });
            if (!product) {
                return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
            }
            const variant = product.variants.id(item.variantId);
            if (!variant) {
                return res.status(404).json({ success: false, error: `Variant not found: ${item.variantId}` });
            }

            // Check inventory
            const inventory = await Inventory.findOne({
                tenantId: req.tenantId,
                warehouseId: data.warehouseId,
                productId: item.productId,
                variantId: item.variantId
            });

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    error: `No stock found for "${product.name}" in this warehouse`
                });
            }

            const available = inventory.quantityOnHand - inventory.quantityReserved;
            if (item.quantity > available) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}`
                });
            }

            // Calculate prices
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * (item.tax || 0)) / 100;
            subtotal += itemTotal;
            taxAmount += itemTax;

            processedItems.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                tax: item.tax || 0,
                totalPrice: itemTotal
            });
        }

        const totalAmount = subtotal + taxAmount;
        const amountPaid = data.amountPaid || totalAmount;
        const changeReturned = Math.max(0, amountPaid - totalAmount);
        const orderNumber = await generatePOSNumber(req.tenantId);

        // Create POS Order
        const posOrder = await POSOrder.create({
            tenantId: req.tenantId,
            orderNumber,
            warehouseId: data.warehouseId,
            customerId: data.customerId || null,
            customerName: data.customerName || 'Walk-in Customer',
            items: processedItems,
            subtotal,
            taxAmount,
            totalAmount,
            paymentMethod: data.paymentMethod || 'cash',
            amountPaid,
            changeReturned,
            notes: data.notes,
            createdBy: req.userId
        });

        // Decrease inventory + log stock movements for each item
        for (const item of processedItems) {
            await Inventory.findOneAndUpdate(
                {
                    tenantId: req.tenantId,
                    warehouseId: data.warehouseId,
                    productId: item.productId,
                    variantId: item.variantId
                },
                { $inc: { quantityOnHand: -item.quantity } }
            );

            await StockMovement.create({
                tenantId: req.tenantId,
                productId: item.productId,
                variantId: item.variantId,
                warehouseId: data.warehouseId,
                movementType: 'OUT',
                referenceType: 'POS',
                referenceId: posOrder._id,
                quantity: -item.quantity,
                date: new Date(),
                createdBy: req.userId,
                notes: `POS Order: ${orderNumber}`
            });
        }

        res.status(201).json({
            success: true,
            message: 'Checkout successful',
            data: {
                orderNumber,
                totalAmount,
                amountPaid,
                changeReturned,
                paymentMethod: posOrder.paymentMethod,
                items: processedItems,
                _id: posOrder._id
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/pos/orders ──────────────────────────────────────────────────────
const getPOSOrders = async (req, res, next) => {
    try {
        const { warehouseId, paymentMethod, startDate, endDate } = req.query;
        const query = { tenantId: req.tenantId };

        if (warehouseId) query.warehouseId = warehouseId;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await POSOrder.find(query)
            .populate('warehouseId', 'name code')
            .populate('customerId', 'name code phone')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/pos/orders/:id ──────────────────────────────────────────────────
const getPOSOrder = async (req, res, next) => {
    try {
        const order = await POSOrder.findOne({ _id: req.params.id, tenantId: req.tenantId })
            .populate('warehouseId', 'name code address')
            .populate('customerId', 'name code phone email')
            .populate('createdBy', 'fullName email');

        if (!order) {
            return res.status(404).json({ success: false, error: 'POS order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/pos/product/barcode/:barcode ────────────────────────────────────
// Cashier scans barcode → returns product + variant info instantly
const getProductByBarcode = async (req, res, next) => {
    try {
        const { barcode } = req.params;
        const { warehouseId } = req.query;

        const product = await Product.findOne({ barcode, tenantId: req.tenantId });
        if (!product) {
            return res.status(404).json({ success: false, error: `No product found for barcode: ${barcode}` });
        }

        // Get stock info for each variant in this warehouse
        const variantsWithStock = await Promise.all(
            product.variants.map(async (variant) => {
                let stock = null;
                if (warehouseId) {
                    const inv = await Inventory.findOne({
                        tenantId: req.tenantId,
                        warehouseId,
                        productId: product._id,
                        variantId: variant._id
                    });
                    if (inv) {
                        stock = {
                            quantityOnHand: inv.quantityOnHand,
                            quantityReserved: inv.quantityReserved,
                            availableQuantity: inv.quantityOnHand - inv.quantityReserved
                        };
                    }
                }
                return {
                    variantId: variant._id,
                    attributes: variant.attributes,
                    price: variant.price,
                    cost: variant.cost,
                    stock
                };
            })
        );

        res.json({
            success: true,
            data: {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                barcode: product.barcode,
                taxRate: product.taxRate,
                uom: product.uom,
                variants: variantsWithStock
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { checkout, getPOSOrders, getPOSOrder, getProductByBarcode };
