const Customer = require('../models/Customer');
const SalesOrder = require('../models/SalesOrder');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customerValidator');

const createCustomer = async (req, res, next) => {
    try {
        const data = createCustomerSchema.parse(req.body);

        const existing = await Customer.findOne({ tenantId: req.tenantId, code: data.code });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Customer code already exists' });
        }

        const customer = await Customer.create({ tenantId: req.tenantId, ...data });
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const { isActive, search } = req.query;
        const query = { tenantId: req.tenantId };

        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        next(error);
    }
};

const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.tenantId });
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const data = updateCustomerSchema.parse(req.body);

        if (data.code) {
            const existing = await Customer.findOne({
                tenantId: req.tenantId,
                code: data.code,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Customer code already exists' });
            }
        }

        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            data,
            { new: true, runValidators: true }
        );
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.tenantId });
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Protect: cannot delete if sales orders exist
        const hasSO = await SalesOrder.findOne({ customerId: customer._id });
        if (hasSO) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete customer with existing sales orders'
            });
        }

        await customer.deleteOne();
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer };
