const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get notifications with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, priority, department_id, year, section, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, 
             u.name as created_by_name,
             d.name as department_name,
             COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'read') as read_count,
             COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'acknowledged') as acknowledged_count,
             EXISTS(SELECT 1 FROM acknowledgments WHERE notification_id = n.id AND user_id = $1) as is_read,
             (SELECT status FROM acknowledgments WHERE notification_id = n.id AND user_id = $1) as user_status
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN acknowledgments a ON n.id = a.notification_id
      WHERE 1=1
    `;
    const params = [req.user.id];
    let paramCount = 2;

    // Apply role-based filtering
    if (req.user.role === 'student') {
      // Students see notifications for their department, year, section, or general ones
      query += ` AND (
        (n.department_id IS NULL OR n.department_id = $${paramCount++}) AND
        (n.year IS NULL OR n.year = $${paramCount++}) AND
        (n.section IS NULL OR n.section = $${paramCount++} OR n.section = '')
      )`;
      params.push(req.user.department_id, req.user.year, req.user.section);
    } else if (req.user.role === 'faculty') {
      // Faculty see notifications for their department or general ones
      query += ` AND (n.department_id IS NULL OR n.department_id = $${paramCount++})`;
      params.push(req.user.department_id);
    }

    // Apply filters
    if (category) {
      query += ` AND n.category = $${paramCount++}`;
      params.push(category);
    }
    if (priority) {
      query += ` AND n.priority = $${paramCount++}`;
      params.push(priority);
    }
    if (department_id) {
      query += ` AND n.department_id = $${paramCount++}`;
      params.push(department_id);
    }
    if (year) {
      query += ` AND n.year = $${paramCount++}`;
      params.push(year);
    }
    if (section) {
      query += ` AND n.section = $${paramCount++}`;
      params.push(section);
    }
    if (search) {
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY n.id, u.name, d.name
               ORDER BY n.is_pinned DESC, n.created_at DESC
               LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT n.id) as total FROM notifications n WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (req.user.role === 'student') {
      countQuery += ` AND (
        (n.department_id IS NULL OR n.department_id = $${countParamCount++}) AND
        (n.year IS NULL OR n.year = $${countParamCount++}) AND
        (n.section IS NULL OR n.section = $${countParamCount++} OR n.section = '')
      )`;
      countParams.push(req.user.department_id, req.user.year, req.user.section);
    } else if (req.user.role === 'faculty') {
      countQuery += ` AND (n.department_id IS NULL OR n.department_id = $${countParamCount++})`;
      countParams.push(req.user.department_id);
    }

    if (category) {
      countQuery += ` AND n.category = $${countParamCount++}`;
      countParams.push(category);
    }
    if (priority) {
      countQuery += ` AND n.priority = $${countParamCount++}`;
      countParams.push(priority);
    }
    if (search) {
      countQuery += ` AND (n.title ILIKE $${countParamCount} OR n.content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await db.pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single notification
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT n.*, 
              u.name as created_by_name,
              d.name as department_name,
              COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'read') as read_count,
              COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'acknowledged') as acknowledged_count,
              EXISTS(SELECT 1 FROM acknowledgments WHERE notification_id = n.id AND user_id = $1) as is_read,
              (SELECT status FROM acknowledgments WHERE notification_id = n.id AND user_id = $1) as user_status
       FROM notifications n
       LEFT JOIN users u ON n.created_by = u.id
       LEFT JOIN departments d ON n.department_id = d.id
       LEFT JOIN acknowledgments a ON n.id = a.notification_id
       WHERE n.id = $2
       GROUP BY n.id, u.name, d.name`,
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification
router.post('/', authenticate, authorize('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').isIn(['Academic', 'Exam', 'Placement', 'Events', 'Administrative', 'Emergency']),
  body('priority').isIn(['Emergency', 'High', 'Normal', 'Info']),
  body('department_id').optional().isInt(),
  body('year').optional().isInt(),
  body('section').optional().trim(),
  body('scheduled_at').optional().isISO8601(),
  body('is_pinned').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, priority, department_id, year, section, scheduled_at, is_pinned } = req.body;

    // Faculty can only create notifications for their department
    if (req.user.role === 'faculty' && department_id && department_id !== req.user.department_id) {
      return res.status(403).json({ message: 'You can only create notifications for your department' });
    }

    const result = await db.pool.query(
      `INSERT INTO notifications (title, content, category, priority, created_by, department_id, year, section, scheduled_at, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, content, category, priority, req.user.id, department_id || null, year || null, section || null, scheduled_at || null, is_pinned || false]
    );

    const notification = result.rows[0];

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      // Determine target users based on filters
      let targetQuery = 'SELECT id FROM users WHERE 1=1';
      const targetParams = [];

      if (department_id) {
        targetQuery += ` AND (department_id = $${targetParams.length + 1} OR department_id IS NULL)`;
        targetParams.push(department_id);
      }
      if (year) {
        targetQuery += ` AND (year = $${targetParams.length + 1} OR year IS NULL)`;
        targetParams.push(year);
      }
      if (section) {
        targetQuery += ` AND (section = $${targetParams.length + 1} OR section IS NULL)`;
        targetParams.push(section);
      }

      const targetUsers = await db.pool.query(targetQuery, targetParams);
      targetUsers.rows.forEach(user => {
        io.to(`user-${user.id}`).emit('new-notification', notification);
      });
    }

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification
router.put('/:id', authenticate, authorize('admin', 'faculty'), [
  body('title').optional().trim().notEmpty(),
  body('content').optional().trim().notEmpty(),
  body('category').optional().isIn(['Academic', 'Exam', 'Placement', 'Events', 'Administrative', 'Emergency']),
  body('priority').optional().isIn(['Emergency', 'High', 'Normal', 'Info']),
  body('is_pinned').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if notification exists and user has permission
    const existing = await db.pool.query(
      'SELECT created_by, department_id FROM notifications WHERE id = $1',
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Faculty can only update their own notifications
    if (req.user.role === 'faculty' && existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content, category, priority, is_pinned } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (is_pinned !== undefined) {
      updates.push(`is_pinned = $${paramCount++}`);
      values.push(is_pinned);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await db.pool.query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', authenticate, authorize('admin', 'faculty'), async (req, res) => {
  try {
    // Check if notification exists and user has permission
    const existing = await db.pool.query(
      'SELECT created_by FROM notifications WHERE id = $1',
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Faculty can only delete their own notifications
    if (req.user.role === 'faculty' && existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read/acknowledged
router.post('/:id/acknowledge', authenticate, [
  body('status').isIn(['read', 'acknowledged']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    // Check if notification exists
    const notification = await db.pool.query('SELECT id FROM notifications WHERE id = $1', [req.params.id]);
    if (notification.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Insert or update acknowledgment
    const result = await db.pool.query(
      `INSERT INTO acknowledgments (notification_id, user_id, status, read_at, acknowledged_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (notification_id, user_id)
       DO UPDATE SET status = $3, 
                     read_at = CASE WHEN $3 = 'read' THEN CURRENT_TIMESTAMP ELSE acknowledgments.read_at END,
                     acknowledged_at = CASE WHEN $3 = 'acknowledged' THEN CURRENT_TIMESTAMP ELSE acknowledgments.acknowledged_at END
       RETURNING *`,
      [req.params.id, req.user.id, status, status === 'acknowledged' ? new Date() : null]
    );

    res.json({ acknowledgment: result.rows[0] });
  } catch (error) {
    console.error('Acknowledge notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
