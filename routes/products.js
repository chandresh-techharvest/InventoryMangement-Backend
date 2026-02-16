const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const {
    validateCreateProduct,
    validateUpdateProduct
} = require('../validators/productValidator');

// All routes require authentication
router.use(protect);

// Product routes
router.route('/')
    .get(getProducts)
    .post(validateCreateProduct, createProduct);

router.route('/:id')
    .get(getProduct)
    .put(validateUpdateProduct, updateProduct)
    .delete(deleteProduct);

module.exports = router;
