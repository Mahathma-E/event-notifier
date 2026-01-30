const db = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add columns to users table
        await db.pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS designation VARCHAR(50),
      ADD COLUMN IF NOT EXISTS subjects TEXT;
    `);
        console.log('Added designation and subjects columns to users table');

        // 2. Update od_requests status check constraint
        // First drop the old constraint if we can find its name, or just alter the type if it was an enum (it was a check constraint in create table)
        // In postgres, getting the constraint name is tricky if not named explicitly.
        // We'll try to drop the constraint by name if we can guess it, otherwise we might need to do a do block.
        // The previous create was: CHECK (status IN ('pending', 'approved', 'rejected'))

        // Let's check if we can simply alter the check.
        // Actually, easiest way is to drop the constraint.
        // Let's find the constraint name first.

        const constraintResult = await db.pool.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'od_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    `);

        if (constraintResult.rows.length > 0) {
            const constraintName = constraintResult.rows[0].conname;
            console.log(`Found status constraint: ${constraintName}`);
            await db.pool.query(`ALTER TABLE od_requests DROP CONSTRAINT "${constraintName}"`);
            console.log('Dropped old status constraint');
        }

        // Add new constraint
        await db.pool.query(`
      ALTER TABLE od_requests 
      ADD CONSTRAINT od_requests_status_check 
      CHECK (status IN ('pending_coordinator', 'pending_hod', 'approved', 'rejected'));
    `);
        console.log('Added new status constraint');

        // Update existing pending requests to pending_coordinator
        await db.pool.query(`
        UPDATE od_requests SET status = 'pending_coordinator' WHERE status = 'pending'
    `);
        console.log('Updated existing pending requests');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
