const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    checkout,
    getPOSOrders,
    getPOSOrder,
    getProductByBarcode
} = require('../controllers/posController');

router.use(protect);

// Barcode lookup — cashier scans barcode to get product + stock
router.get('/product/barcode/:barcode', getProductByBarcode);

// Checkout — one-shot: create order + decrease inventory
router.post('/checkout', checkout);

// Order history
router.route('/orders')
    .get(getPOSOrders);

router.route('/orders/:id')
    .get(getPOSOrder);

module.exports = router;
