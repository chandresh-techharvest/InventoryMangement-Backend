const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

router.use(protect);

router.route('/')
    .post(createSupplier)
    .get(getSuppliers);

router.route('/:id')
    .get(getSupplier)
    .put(updateSupplier)
    .delete(deleteSupplier);

module.exports = router;
