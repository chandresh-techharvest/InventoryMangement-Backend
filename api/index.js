const serverless = require('serverless-http');
const app = require('../server');
const connectDB = require('../config/db');

let isDbConnected = false;

async function connectToDBIfNeeded() {
    if (!isDbConnected) {
        // Reuse the existing connectDB logic but ensure we await it
        await connectDB();
        isDbConnected = true;
    }
}

module.exports = async (req, res) => {
    try {
        await connectToDBIfNeeded();
        // Wrap the app with serverless-http and return the handler
        const handler = serverless(app);
        return handler(req, res);
    } catch (err) {
        console.error('❌ Server error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};
