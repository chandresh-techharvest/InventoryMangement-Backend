# POS ERP Backend

Backend API for the Multitenant POS ERP System built with Node.js, Express, and MongoDB.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

3. **Start MongoDB**
   - Make sure MongoDB is running locally on port 27017
   - Or update `MONGO_URI` in `.env` with your MongoDB Atlas connection string

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Server will start on http://localhost:5000

5. **Run Production Server**
   ```bash
   npm start
   ```

## Project Structure

```
pos-erp-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── jwtUtils.js        # JWT token utilities
├── models/
│   ├── Tenant.js          # Tenant schema
│   └── User.js            # User schema
├── routes/
│   └── auth.js            # Authentication routes
├── controllers/
│   └── authController.js  # Auth business logic
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   └── errorMiddleware.js # Error handling
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── server.js             # Entry point
└── package.json          # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/tenant/registration` - Register new tenant + user
- `POST /api/tenant/login` - Login user
- `POST /api/tenant/logout` - Logout user
- `GET /api/tenant/me` - Get current user (protected)

## Environment Variables

See `.env.example` for required environment variables.

## Production Deployment Checklist

- [ ] Update `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or production MongoDB instance
- [ ] Update `CLIENT_URL` to production frontend URL
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring (e.g., PM2, New Relic)
