const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createGRN, getGRNs, getGRN } = require('../controllers/grnController');

router.use(protect);

router.route('/')
    .post(createGRN)
    .get(getGRNs);

router.route('/:id')
    .get(getGRN);

module.exports = router;
