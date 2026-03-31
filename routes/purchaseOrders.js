const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrder,
    updatePOStatus
} = require('../controllers/purchaseOrderController');

router.use(protect);

router.route('/')
    .post(createPurchaseOrder)
    .get(getPurchaseOrders);

router.route('/:id')
    .get(getPurchaseOrder);

router.put('/:id/status', updatePOStatus);

module.exports = router;
