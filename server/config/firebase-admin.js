const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let serviceAccount;

try {
    const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!jsonString) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing from .env');
    }
    serviceAccount = JSON.parse(jsonString);

    // Fix for newline characters in private key when loaded from .env
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (error) {
    console.error('--- FIREBASE CONFIG ERROR ---');
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    console.error('-----------------------------');
    serviceAccount = null;
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('--- FIREBASE INITIALIZATION ERROR ---');
        console.error(error.stack);
        console.error('--------------------------------------');
    }
}

module.exports = admin;
