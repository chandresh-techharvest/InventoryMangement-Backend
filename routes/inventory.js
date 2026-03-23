const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    addStock,
    getInventory,
    getInventoryById,
    updateStock,
    getLowStock,
    getTotalStock,
    getStockMovements,
    transferStock,
    adjustStock
} = require('../controllers/inventoryController');

router.use(protect);

// ✅ MAIN INVENTORY
router.route('/')
    .post(addStock)
    .get(getInventory);

// ✅ EXTRA FEATURES
router.get('/low-stock', getLowStock);
router.get('/total/:productId', getTotalStock);
router.get('/movements', getStockMovements);

// ✅ 🚀 NEW — TRANSFER STOCK
router.post('/transfer', transferStock);

// ✅ 🚀 OPTIONAL — STOCK ADJUSTMENT
router.post('/adjust', adjustStock);

// ✅ SINGLE RECORD
router.route('/:id')
    .get(getInventoryById)
    .put(updateStock);

module.exports = router;