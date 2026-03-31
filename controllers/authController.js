const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { generateToken } = require('../config/jwtUtils');
const crypto = require('crypto');

const corsHeaders = {
    // 'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Origin': 'https://inventory-mangement-backend-theta.vercel.app/',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
};

const registerTenant = async (req, res, next) => {
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(204).set(corsHeaders).send();
    }

    try {
        const { businessName, fullName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            }).set(corsHeaders);
        }

        const subdomain = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;

        const tenant = await Tenant.create({
            businessName,
            subdomain
        });

        const user = await User.create({
            tenantId: tenant._id,
            email,
            password,
            fullName,
            role: 'owner'
        });

        const token = generateToken({
            userId: user._id,
            tenantId: tenant._id,
            role: user.role
        });

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).set(corsHeaders).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            tenant: {
                id: tenant._id,
                businessName: tenant.businessName,
                subdomain: tenant.subdomain
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(204).set(corsHeaders).send();
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).set(corsHeaders).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).set(corsHeaders).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const tenant = await Tenant.findById(user.tenantId);

        if (!tenant || !tenant.isActive) {
            return res.status(403).set(corsHeaders).json({
                success: false,
                error: 'Tenant account is inactive'
            });
        }

        const token = generateToken({
            userId: user._id,
            tenantId: user.tenantId,
            role: user.role
        });

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.set(corsHeaders).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            tenant: {
                id: tenant._id,
                businessName: tenant.businessName,
                subdomain: tenant.subdomain
            }
        });
    } catch (error) {
        next(error);
    }
};

// Apply same pattern to other functions
const getMe = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.status(204).set(corsHeaders).send();
    }
    
    try {
        const user = await User.findById(req.userId).populate('tenantId');
        res.set(corsHeaders).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            tenant: {
                id: user.tenantId._id,
                businessName: user.tenantId.businessName,
                subdomain: user.tenantId.subdomain
            }
        });
    } catch (error) {
        next(error);
    }
};

const logout = (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(204).set(corsHeaders).send();
    }
    
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    }).set(corsHeaders).json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = { registerTenant, login, getMe, logout };
