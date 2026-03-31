const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createWarehouse,
    getWarehouses,
    getWarehouse,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/warehouseController');

router.use(protect);

router.route('/')
    .post(createWarehouse)
    .get(getWarehouses);

router.route('/:id')
    .get(getWarehouse)
    .put(updateWarehouse)
    .delete(deleteWarehouse);

module.exports = router;
