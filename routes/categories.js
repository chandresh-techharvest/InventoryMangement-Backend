const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const {
    validateCreateCategory,
    validateUpdateCategory
} = require('../validators/categoryValidator');

// All routes require authentication
router.use(protect);

// Category routes
router.route('/')
    .get(getCategories)
    .post(validateCreateCategory, createCategory);

router.get('/tree', getCategoryTree);

router.route('/:id')
    .get(getCategory)
    .put(validateUpdateCategory, updateCategory)
    .delete(deleteCategory);

module.exports = router;
