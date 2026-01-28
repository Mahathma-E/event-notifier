const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all departments (public endpoint for registration)
router.get('/', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT id, name, code FROM departments ORDER BY name'
    );

    res.json({ departments: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
