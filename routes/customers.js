const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');

router.use(protect);

router.route('/')
    .post(createCustomer)
    .get(getCustomers);

router.route('/:id')
    .get(getCustomer)
    .put(updateCustomer)
    .delete(deleteCustomer);

module.exports = router;
