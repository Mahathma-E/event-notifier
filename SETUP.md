# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# From project root
npm install

# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE gce_smart_notify;
\q
```

Or using pgAdmin or any PostgreSQL client.

### 3. Environment Configuration

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gce_smart_notify
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

**Frontend (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 4. Start the Application

**Option 1: Run both together (recommended)**
```bash
# From project root
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### 6. Default Login

After first run, use these credentials:
- **Email:** admin@gce.edu
- **Password:** admin123

⚠️ **Important:** Change the default password in production!

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `server/.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in `server/.env` (backend)
- Next.js will automatically use next available port for frontend

### Module Not Found Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure you're in the correct directory

### Database Tables Not Created
- The tables are auto-created on first server start
- Check server logs for any database errors
- Ensure database user has CREATE TABLE permissions

## Next Steps

1. Register additional users (Admin, Faculty, Students)
2. Create departments if needed (defaults are created automatically)
3. Start creating notifications!
4. Explore the analytics dashboard

For detailed documentation, see [README.md](./README.md)
