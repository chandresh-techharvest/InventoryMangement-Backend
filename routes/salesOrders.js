const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createSalesOrder,
    getSalesOrders,
    getSalesOrder,
    updateSOStatus
} = require('../controllers/salesOrderController');

router.use(protect);

router.route('/')
    .post(createSalesOrder)
    .get(getSalesOrders);

router.route('/:id')
    .get(getSalesOrder);

router.put('/:id/status', updateSOStatus);

module.exports = router;
