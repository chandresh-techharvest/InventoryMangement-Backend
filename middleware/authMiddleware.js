const { verifyToken } = require('../config/jwtUtils');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        // Read token from httpOnly cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Fallback to Authorization header for API testing
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        const decoded = verifyToken(token);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        req.user = user;
        req.tenantId = decoded.tenantId;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

module.exports = { protect };
