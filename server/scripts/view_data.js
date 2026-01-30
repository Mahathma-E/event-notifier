const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gce_smart_notify',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function showTable(tableName) {
    try {
        const res = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 10`);
        console.log(`\n=== Contents of '${tableName}' (Last 10 records) ===`);
        if (res.rows.length === 0) {
            console.log('  (Empty table)');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        if (err.code === '42P01') {
            console.log(`\nTable '${tableName}' does not exist.`);
        } else {
            console.error(`Error querying ${tableName}:`, err.message);
        }
    }
}

async function main() {
    const tables = ['users', 'channels', 'notifications', 'od_requests', 'channel_members'];

    console.log('Connecting to database...');
    console.log(`DB Name: ${process.env.DB_NAME || 'gce_smart_notify'}`);

    for (const table of tables) {
        await showTable(table);
    }

    await pool.end();
}

main();
