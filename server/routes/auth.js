const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().notEmpty(),
  body('role').isIn(['faculty', 'student']),
  body('firebase_uid').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is restricted.' });
    }

    const { email, name, role, department_id, year, firebase_uid, designation, subjects } = req.body;

    // Check if user exists
    const existingUser = await db.pool.query('SELECT id FROM users WHERE email = $1 OR firebase_uid = $2', [email, firebase_uid]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert user
    const result = await db.pool.query(
      `INSERT INTO users (email, firebase_uid, name, role, department_id, year, designation, subjects)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, name, role, department_id, year, designation, subjects, firebase_uid`,
      [email, firebase_uid, name, role, department_id || null, year || null, designation || null, subjects || null]
    );

    const user = result.rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department_id: user.department_id,
        year: user.year,
        designation: user.designation,
        subjects: user.subjects
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (Now handled on client, this endpoint is for profile retrieval/sync)
router.post('/login', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.department_id, u.year, u.designation, u.subjects, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = $1 OR u.firebase_uid = $2`,
      [req.user.email, req.firebaseUser?.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
