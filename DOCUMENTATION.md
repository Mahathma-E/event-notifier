# GCE Smart Notify - Intelligent Digital Notification System

## 1. Project Overview
**GCE Smart Notify** is a comprehensive digital notification and workflow management system designed for Government College of Engineering. It replaces traditional circulars and manual processes with a centralized, role-based digital platform. The application features a modern, dark-themed UI inspired by Twitter/X, ensuring a premium user experience.

## 2. Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Axios, React Icons, Recharts.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL.
- **Authentication**: Firebase Authentication (Google Sign-In), Custom JWT (JSON Web Tokens).
- **Real-time**: Socket.io (planned/partial support).

## 3. Key Features

### 🔐 Authentication & Roles
- **Google Sign-In integration** for secure and easy access.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Full system control, user management, global settings.
  - **Faculty**: Can create notifications, manage specific channels, approve ODs.
  - **Student**: View notifications, join channels, request ODs.
  - **HOD/Coordinator**: Special designation-based workflows for OD approvals.

### 📢 Digital Notice Board & Channels
- **Global Notices**: Campus-wide updates visible to everyone.
- **Channels**: Focused groups (e.g., "Placement", "Sports", "Dept Events").
  - **Public Channels**: Open for all to join.
  - **Private Channels**: Restricted access. Visible only to members or users with matching role tags.
  - **Channel Management**:
    - **Super Admins** can delete channels, kick members, and assign **Channel Admins**.
    - **Channel Admins** (Faculty/Students) can post updates and manage their specific channel.
- **Role-Based Tagging**: Channels can be tagged (e.g., "Year 1", "CSE") so valuable info automatically reaches the right audience.

### 📝 OD (On-Duty) & Leave Management
- **Digital Workflow**: Students submit OD requests online.
- **Approval Chain**:
  1.  **Faculty Advisor/Tutor** (Initial Review).
  2.  **HOD** (Head of Department) Approval.
  3.  **OD Coordinator** (Final Sanctioning).
- **Status Tracking**: Live updates (Pending, Approved, Rejected) with comments.
- **PDF Generation**: Downloadable OD slips (planned/partially implemented).

### 📊 Analytics Dashboard
- **Engagement Metrics**: Track views and acknowledgments of notices.
- **Visual Charts**:
  - Daily notification trends.
  - Department-wise reach (using abbreviated labels like IT, CSE).
  - Priority-based breakdown.
- **Admins Only**: Access to granular data to monitor system usage.

### 👤 User Management
- **Admin Panel**: View all registered users.
- **Profile Management**: Update department, year, and contact info.
- **Role Assignment**: Admins can promote/demote users and assign designations (HOD, Coordinator).

## 4. Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running.
- Firebase Project (for Auth).

### Steps
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Mahathma-E/event-notifier.git
    cd gce
    ```

2.  **Database Setup**
    - Create a PostgreSQL database (e.g., `gce_notify`).
    - Import the schema from `server/database.sql` (if available) or run migrations.

3.  **Backend Configuration**
    - Go to `server/`:
      ```bash
      cd server
      npm install
      ```
    - Create `.env`:
      ```env
      PORT=5000
      DB_USER=your_user
      DB_PASSWORD=your_password
      DB_HOST=localhost
      DB_PORT=5432
      DB_NAME=gce_notify
      JWT_SECRET=your_jwt_secret
      CLIENT_URL=http://localhost:3000
      ```
    - Run Server: `npm run dev`

4.  **Frontend Configuration**
    - Go to `client/`:
      ```bash
      cd client
      npm install
      ```
    - Create `.env.local`:
      ```env
      NEXT_PUBLIC_API_URL=http://localhost:5000/api
      NEXT_PUBLIC_FIREBASE_API_KEY=...
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
      # ... other firebase configs
      ```
    - Run Client: `npm run dev`

5.  **Access App**: Open `http://localhost:3000`.

## 5. Usage Guide

### For Super Admin
- **Manage Channels**: Go to Channels -> Click channel -> Use the Shield icon to manage admins or Trash icon to delete the channel.
- **Manage Users**: Dashboard -> User Management -> Edit roles, subjects, and designations.
- **Analytics**: Check the sidebar "Analytics" tab for insights.

### For Faculty
- **Post Notices**: Use "Create Notice" to send global updates or go to a specific Channel to post.
- **Approve OD**: Go to "OD Requests" to see pending requests from your students.
- **Channel Admin**: If assigned, manage your channel's members and posts.

### For Students
- **View Updates**: Check Dashboard for latest notices.
- **Join Channels**: Browse "Channels" list and join relevant groups (e.g., "Coding Club").
- **Request OD**: Go to "OD Requests" -> "New Request" -> Fill form -> Submit.

## 6. Directory Structure
```
gce/
├── client/          # Next.js Frontend
│   ├── app/         # App Router pages (dashboard, od, channels...)
│   ├── components/  # Reusable UI components (Layout, Cards...)
│   ├── contexts/    # React Context (AuthContext)
│   └── public/      # Static assets (images, icons)
├── server/          # Express Backend
│   ├── config/      # DB and Firebase config
│   ├── middleware/  # Auth & Role checks
│   ├── routes/      # API endpoints (auth, channels, od, users...)
│   └── scripts/     # Migration and utility scripts
└── ...
```

---
*Generated by Antigravity Agent*
