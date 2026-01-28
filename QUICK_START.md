# Quick Start Guide - GCE Smart Notify

## Current Status
✅ Environment files created
✅ Dependencies installed
✅ Application started
❌ PostgreSQL database needs to be created

## Next Steps

### 1. Install PostgreSQL (if not installed)

Download and install PostgreSQL from: https://www.postgresql.org/download/windows/

During installation:
- Remember the password you set for the `postgres` user
- Default port is 5432 (keep this)
- Install pgAdmin (optional but helpful)

### 2. Create the Database

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `gce_smart_notify`
5. Click "Save"

**Option B: Using psql (Command Line)**
```bash
psql -U postgres
CREATE DATABASE gce_smart_notify;
\q
```

**Option C: Using SQL Script**
1. Open any PostgreSQL client
2. Run the contents of `setup-database.sql`

### 3. Update Database Password

Edit `server/.env` and update the `DB_PASSWORD` if your PostgreSQL password is different from `postgres`:

```env
DB_PASSWORD=your_actual_postgres_password
```

### 4. Restart the Application

If the app is already running, restart it:

```powershell
# Stop current processes (Ctrl+C in the terminal where it's running)
# Then restart:
cd D:\project\gce
npm run dev
```

### 5. Access the Application

Once everything is set up:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

**Default Login:**
- Email: `admin@gce.edu`
- Password: `admin123`

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL service is running
- Check database name matches: `gce_smart_notify`
- Verify username and password in `server/.env`
- Check PostgreSQL is listening on port 5432

### Port Already in Use
- Change `PORT` in `server/.env` to a different port
- Update `NEXT_PUBLIC_API_URL` in `client/.env.local` accordingly

### Module Not Found
```powershell
cd server
npm install
cd ../client
npm install
```

## What Happens on First Run

1. Server connects to PostgreSQL
2. Database tables are automatically created
3. Default departments are inserted
4. Default admin user is created (admin@gce.edu / admin123)
5. Application is ready to use!

## Need Help?

Check the main [README.md](./README.md) for detailed documentation.
