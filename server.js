require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Connect to database
connectDB().catch(err => console.error('DB connection failed:', err));

// CORS configuration - allow multiple origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
            categories: '/api/categories'
        }
    });
});

app.use('/api/tenant', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorHandler);

// For Vercel serverless
if (process.env.VERCEL) {
    module.exports = app;
} else {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
