const app = require('../server');
const connectDB = require('../config/db');

let isDbConnected = false;

async function connectToDBIfNeeded() {
    if (!isDbConnected) {
        try {
            await connectDB();
            isDbConnected = true;
            console.log("✅ MongoDB connected (serverless)");
        } catch (error) {
            console.error("❌ MongoDB connection failed:", error);
        }
    }
}

module.exports = async (req, res) => {
    try {
        await connectToDBIfNeeded();
        return app(req, res);
    } catch (err) {
        console.error('❌ Server error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};
