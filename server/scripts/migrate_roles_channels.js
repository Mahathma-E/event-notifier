const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gce_smart_notify',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration for Roles and Channels...');

        await client.query('BEGIN');

        // 1. Create Roles Table
        console.log('Creating roles table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(20) DEFAULT '#3B82F6',
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Create User Roles Table (Many-to-Many)
        console.log('Creating user_roles table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
      )
    `);

        // 3. Create Channels Table
        console.log('Creating channels table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 4. Create Channel Tags Table (Channels linked to Roles which act as Tags)
        console.log('Creating channel_tags table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS channel_tags (
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (channel_id, role_id)
      )
    `);

        // 5. Create Notification Roles Table (For targeted notifications)
        console.log('Creating notification_roles table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS notification_roles (
        notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (notification_id, role_id)
      )
    `);

        // Indexes
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
      CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
      CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
      CREATE INDEX IF NOT EXISTS idx_channel_tags_role ON channel_tags(role_id);
    `);

        // Default Roles (Optional seed)
        console.log('Seeding default roles...');
        await client.query(`
      INSERT INTO roles (name, color, is_public, description) VALUES
      ('Faculty', '#EF4444', TRUE, 'All faculty members'),
      ('Student', '#10B981', TRUE, 'All students'),
      ('Placement', '#F59E0B', TRUE, 'Placement Cell related'),
      ('Sports', '#8B5CF6', TRUE, 'Sports committee')
      ON CONFLICT (name) DO NOTHING
    `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
