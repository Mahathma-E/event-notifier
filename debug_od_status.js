const db = require('./server/config/database');

async function debugOD() {
    try {
        console.log('--- OD Requests ---');
        const ods = await db.pool.query('SELECT id, user_id, status as od_status, action_by FROM od_requests ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(ods.rows, null, 2));

        console.log('\n--- Faculty Users ---');
        const users = await db.pool.query('SELECT id, name, email, role, department_id, designation FROM users WHERE role = \'faculty\'');
        console.log(JSON.stringify(users.rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugOD();
