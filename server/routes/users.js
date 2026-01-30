const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
// Get all users (Admin only) - Paginated, Searchable, Filterable
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const offset = (page - 1) * limit;

    const params = [];
    const conditions = [];

    // Base strings
    let baseQuery = `
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
    `;

    // Search condition
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    // Role filter
    if (role && role !== 'all') {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    // 1. Get Total Count
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await db.pool.query(countQuery, params);
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    // 2. Get Data
    const dataQuery = `
      SELECT u.id, u.email, u.name, u.role, u.department_id, u.year, u.designation, u.subjects, 
             d.name as department_name, u.created_at
      ${baseQuery}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const listParams = [...params, limit, offset];
    const result = await db.pool.query(dataQuery, listParams);

    res.json({
      users: result.rows,
      meta: {
        total: totalUsers,
        page,
        limit,
        totalPages
      }
    });
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

// Get user's channel feed (posts from joined channels)
router.get('/channel-feed', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT cp.id, cp.title, cp.content, cp.created_at, cp.channel_id,
             c.name as channel_name, u.name as author_name
      FROM channel_posts cp
      JOIN channel_members cm ON cp.channel_id = cm.channel_id
      JOIN channels c ON cp.channel_id = c.id
      JOIN users u ON cp.created_by = u.id
      WHERE cm.user_id = $1
      ORDER BY cp.created_at DESC
      LIMIT 50
    `;
    const result = await db.pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching channel feed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
