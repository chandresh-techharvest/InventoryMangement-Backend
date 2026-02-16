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

## API Endpoints

### Authentication
- `POST /api/tenant/registration` - Register new tenant + user
- `POST /api/tenant/login` - Login user
- `POST /api/tenant/logout` - Logout user

## Environment Variables

See `.env.example` for required environment variables.
