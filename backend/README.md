# EventCraft Backend

This is the backend API server for EventCraft built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Compass (or MongoDB Community Server)
- npm or yarn

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start MongoDB**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Or start MongoDB service:
     ```bash
     # On macOS with Homebrew
     brew services start mongodb/brew/mongodb-community
     
     # On Windows
     net start MongoDB
     
     # On Linux
     sudo systemctl start mongod
     ```

3. **Environment Variables**
   - The `.env` file is already configured for local development
   - Database: `mongodb://localhost:27017/eventcraft`
   - Port: `5000`

4. **Run the Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Verify Setup**
   - Backend should be running on: http://localhost:5000
   - Test endpoint: http://localhost:5000/api/health

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (to be implemented)

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users` - Get users (protected)
- `GET /api/events` - Get events
- `POST /api/events` - Create event (protected)

## Project Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Ticket.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── event.routes.js
│   └── ticket.routes.js
├── .env
├── server.js
└── package.json
```

## Database Schema

The application uses MongoDB with the following collections:
- **users** - User accounts and profiles
- **events** - Event information
- **tickets** - Event tickets and registrations

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/eventcraft
JWT_SECRET=eventcraftsecretkey2025
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
