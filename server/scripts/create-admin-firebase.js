const admin = require('../config/firebase-admin');
const { pool } = require('../config/database');

const createAdminInFirebase = async () => {
    const email = 'admin@gce.edu';
    const password = 'admin123';

    try {
        console.log(`Checking if user ${email} exists in Firebase...`);
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log('User already exists in Firebase.');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('User not found in Firebase. Creating...');
                userRecord = await admin.auth().createUser({
                    email,
                    password,
                    emailVerified: true,
                    displayName: 'Super Admin',
                });
                console.log('User created successfully in Firebase.');
            } else {
                throw error;
            }
        }

        const firebaseUid = userRecord.uid;
        console.log(`Firebase UID: ${firebaseUid}`);

        console.log('Updating PostgreSQL database...');
        await pool.query(
            'UPDATE users SET firebase_uid = $1 WHERE email = $2',
            [firebaseUid, email]
        );
        console.log('PostgreSQL database updated successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminInFirebase();
