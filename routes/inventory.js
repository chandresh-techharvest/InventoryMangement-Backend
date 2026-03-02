const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    addStock,
    getInventory,
    getInventoryById,
    updateStock,
    getLowStock,
    getTotalStock
} = require('../controllers/inventoryController');

router.use(protect);

router.route('/')
    .post(addStock)
    .get(getInventory);

router.get('/low-stock', getLowStock);
router.get('/total/:productId', getTotalStock);

router.route('/:id')
    .get(getInventoryById)
    .put(updateStock);

module.exports = router;
