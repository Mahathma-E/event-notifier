const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.department_id, u.year, u.designation, u.subjects, 
              d.name as department_name, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await db.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.department_id, u.year, u.designation, u.subjects, 
              d.name as department_name, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('department_id').optional({ nullable: true }).isInt(),
  body('year').optional({ nullable: true }).isInt(),
  body('designation').optional({ nullable: true }),
  body('subjects').optional({ nullable: true }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, department_id, year, designation, subjects } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (department_id !== undefined) {
      updates.push(`department_id = $${paramCount++}`);
      values.push(department_id);
    }
    if (year !== undefined) {
      updates.push(`year = $${paramCount++}`);
      values.push(year);
    }
    if (designation !== undefined) {
      updates.push(`designation = $${paramCount++}`);
      values.push(designation);
    }
    if (subjects !== undefined) {
      updates.push(`subjects = $${paramCount++}`);
      values.push(subjects);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await db.pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, name, role, department_id, year, designation, subjects`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
