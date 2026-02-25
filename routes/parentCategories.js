const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
    getParentCategories,
    createParentCategory,
    getParentCategory,
    updateParentCategory,
    deleteParentCategory
} = require('../controllers/parentCategoryController');

const {
    validateCreateParentCategory,
    validateUpdateParentCategory
} = require('../validators/parentCategoryValidator');

router.use(protect);

// /api/parent-categories
router.route('/')
    .get(getParentCategories)
    .post(validateCreateParentCategory, createParentCategory);

router.route('/:id')
    .get(getParentCategory)
    .put(validateUpdateParentCategory, updateParentCategory)
    .delete(deleteParentCategory);

module.exports = router;