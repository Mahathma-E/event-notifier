const db = require('../config/database');

async function migrate() {
    try {
        console.log('Adding attachment columns to notifications table...');

        await db.pool.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS attachment_url TEXT,
            ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);
        `);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
