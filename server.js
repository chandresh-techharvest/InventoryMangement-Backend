require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const warehouseRoutes = require('./routes/warehouses');
// const inventoryRoutes = require('./routes/inventory');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// CORS configuration - allow multiple origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://inventory-mangement-tau-eight.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'POS ERP Backend API',
        endpoints: {
            auth: '/api/tenant',
            products: '/api/products',
            categories: '/api/categories',
            warehouses: '/api/warehouses',
            inventory: '/api/inventory'
        }
    });
});

app.use('/api/tenant', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
// app.use('/api/inventory', inventoryRoutes);

app.use(errorHandler);

// Constants
const PORT = process.env.PORT || 5000;

// Export app for serverless use
module.exports = app;

// Start server only if run directly (not imported)
if (require.main === module) {
    // Connect to database only when running locally or on traditional server
    const connectDB = require('./config/db');
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });
}
