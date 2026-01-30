const admin = require('../config/firebase-admin');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email } = decodedToken;

    const result = await db.pool.query(
      'SELECT id, email, name, role, department_id, year, designation, subjects FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User profile not found in database. Please register.' });
    }

    req.user = result.rows[0];
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
