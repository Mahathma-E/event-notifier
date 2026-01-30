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
        console.log('Starting migration for Interactive Channels...');

        await client.query('BEGIN');

        // 1. Channel Members (User joins a channel)
        console.log('Creating channel_members table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS channel_members (
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (channel_id, user_id)
      )
    `);

        // 2. Channel Admins (Faculty assigned to manage a channel)
        console.log('Creating channel_admins table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS channel_admins (
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (channel_id, user_id)
      )
    `);

        // 3. Channel Posts (Content within a channel)
        console.log('Creating channel_posts table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS channel_posts (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type VARCHAR(50),
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Indexes
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_channel_posts_channel ON channel_posts(channel_id);
      CREATE INDEX IF NOT EXISTS idx_channel_posts_created_at ON channel_posts(created_at DESC);
    `);

        await client.query('COMMIT');
        console.log('Interactive Channels migration completed successfully!');
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
