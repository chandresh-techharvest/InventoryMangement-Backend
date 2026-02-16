const express = require('express');
const { registerTenant, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../validators/authValidator');
const { registerSchema, loginSchema } = require('../validators/authValidator');

const router = express.Router();

router.post('/registration', validate(registerSchema), registerTenant);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
