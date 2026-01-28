# GCE Smart Notify

**Intelligent Digital Notification Framework for GCE Erode**

A production-grade campus communication platform that centralizes all academic and administrative notifications with role-based access, prioritization, tracking, and analytics.

## Features

- ✅ **Centralized Notification Feed** - Single hub for all campus communications
- ✅ **Role-Based Access Control** - Admin, Faculty, and Student roles with appropriate permissions
- ✅ **Category System** - Academic, Exam, Placement, Events, Administrative, Emergency
- ✅ **Priority Tags** - Emergency, High, Normal, Info with color coding
- ✅ **Real-time Notifications** - WebSocket-based instant updates
- ✅ **Read/Acknowledged Tracking** - Track who has read and acknowledged notifications
- ✅ **Search & Filter** - Find notifications by category, priority, department, year, section
- ✅ **Scheduled Announcements** - Schedule notifications for future delivery
- ✅ **Analytics Dashboard** - Comprehensive analytics with charts and metrics
- ✅ **Department-wise Filtering** - Target specific departments, years, and sections
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** + **Express** - RESTful API server
- **PostgreSQL** - Relational database
- **Socket.io** - Real-time communication
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Recharts** - Analytics charts
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd gce
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Set up PostgreSQL database

Create a PostgreSQL database:

```sql
CREATE DATABASE gce_smart_notify;
```

### 4. Configure environment variables

Create `server/.env` file:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gce_smart_notify
DB_USER=postgres
DB_PASSWORD=postgres
```

Create `client/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 5. Initialize database

The database tables will be automatically created when you start the server for the first time.

### 6. Run the application

From the root directory:

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

Or run them separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Default Credentials

After first run, a default admin user is created:

- **Email:** admin@gce.edu
- **Password:** admin123

**⚠️ Important:** Change the default password in production!

## User Roles

### Admin
- Create, edit, delete notifications
- View all notifications
- Manage users
- Access analytics dashboard
- Export reports

### Faculty
- Create notifications for their department
- View department notifications
- Track student acknowledgments
- Access analytics for their department

### Student
- View personalized notifications based on department, year, and section
- Mark notifications as read/acknowledged
- Filter and search notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Notifications
- `GET /api/notifications` - Get notifications (with filters)
- `GET /api/notifications/:id` - Get single notification
- `POST /api/notifications` - Create notification (Admin/Faculty)
- `PUT /api/notifications/:id` - Update notification (Admin/Faculty)
- `DELETE /api/notifications/:id` - Delete notification (Admin/Faculty)
- `POST /api/notifications/:id/acknowledge` - Mark as read/acknowledged

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics (Admin/Faculty)
- `GET /api/analytics/notification/:id` - Get notification-specific analytics

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Departments
- `GET /api/departments` - Get all departments

## Project Structure

```
gce/
├── server/                 # Backend server
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── hooks/             # Custom hooks
└── package.json           # Root package.json
```

## Features in Detail

### Notification Categories
- **Academic** - Course updates, syllabus changes, academic schedules
- **Exam** - Exam schedules, results, important exam notices
- **Placement** - Job opportunities, placement drives, interviews
- **Events** - College events, workshops, seminars
- **Administrative** - Office notices, fee payments, administrative updates
- **Emergency** - Urgent announcements, emergency alerts

### Priority Levels
- **Emergency** (Red) - Requires immediate attention
- **High** (Orange) - Important, should be read soon
- **Normal** (Blue) - Standard priority
- **Info** (Grey) - Informational, low priority

### Real-time Updates
The application uses WebSockets to deliver real-time notifications. When a new notification is created, all relevant users receive it instantly without refreshing the page.

### Analytics Dashboard
- Total notifications count
- Notifications by category (pie chart)
- Notifications by priority (bar chart)
- Daily trend (line chart)
- Department-wise reach (bar chart)
- Read and acknowledgment statistics

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS settings
4. Use a production PostgreSQL database
5. Set up SSL/HTTPS

### Frontend
1. Build the application: `cd client && npm run build`
2. Start production server: `npm start`
3. Or deploy to Vercel/Netlify

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- SQL injection protection (parameterized queries)
- CORS configuration
- Input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for GCE Erode**
