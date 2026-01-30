const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gce_smart_notify',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Initialize database tables
const initialize = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        firebase_uid VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
        department_id INTEGER,
        year INTEGER,
        designation VARCHAR(50),
        subjects TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(10) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('Academic', 'Exam', 'Placement', 'Events', 'Administrative', 'Emergency')),
        priority VARCHAR(20) NOT NULL CHECK (priority IN ('Emergency', 'High', 'Normal', 'Info')),
        created_by INTEGER NOT NULL REFERENCES users(id),
        department_id INTEGER REFERENCES departments(id),
        year INTEGER,
        scheduled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_pinned BOOLEAN DEFAULT FALSE
      )
    `);

    // Create acknowledgments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS acknowledgments (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'read' CHECK (status IN ('read', 'acknowledged')),
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP,
        UNIQUE(notification_id, user_id)
      )
    `);

    // Create OD requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS od_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending_coordinator' CHECK (status IN ('pending_coordinator', 'pending_hod', 'approved', 'rejected')),
        comment TEXT,
        action_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_department ON notifications(department_id);
      CREATE INDEX IF NOT EXISTS idx_acknowledgments_user ON acknowledgments(user_id);
      CREATE INDEX IF NOT EXISTS idx_acknowledgments_notification ON acknowledgments(notification_id);
    `);

    // Insert default departments if they don't exist
    await pool.query(`
      INSERT INTO departments (name, code) VALUES
      ('Computer Science Engineering', 'CSE'),
      ('Electronics and Communication Engineering', 'ECE'),
      ('Electrical and Electronics Engineering', 'EEE'),
      ('Mechanical Engineering', 'ME'),
      ('Civil Engineering', 'CE'),
      ('Information Technology', 'IT')
      ON CONFLICT (name) DO NOTHING
    `);

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ('admin@gce.edu', $1, 'Super Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initialize
};
