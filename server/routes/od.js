const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get OD requests based on role and workflow
router.get('/', authenticate, async (req, res) => {
    try {
        let query = `
      SELECT o.*, u.name as user_name, u.email as user_email, u.year as user_year, d.name as department_name, 
             a.name as action_by_name
      FROM od_requests o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users a ON o.action_by = a.id
    `;
        const params = [];
        let paramCount = 1;

        if (req.user.role === 'student') {
            query += ` WHERE o.user_id = $${paramCount++}`;
            params.push(req.user.id);
        } else if (req.user.role === 'faculty') {
            // Coordinator sees 'pending_coordinator' for their department
            // HOD sees 'pending_hod' for their department
            // Both can see history (approved/rejected) for their department
            // Regular faculty shouldn't see anything unless they are designated

            if (req.user.department_id) {
                query += ` WHERE u.department_id = $${paramCount++}`;
                params.push(req.user.department_id);

                if (req.user.designation === 'coordinator') {
                    // Coordinators primarily act on pending_coordinator
                    // But they should probably see all to keep track
                } else if (req.user.designation === 'hod') {
                    // HODs act on pending_hod AND pending_coordinator (if they want to override)
                    // So they should see everything for their department
                }
            } else {
                // No department? Shouldn't happen for faculty usually
                // Return empty if not admin
                // But let's assume valid data
            }
        }

        // Admins see all

        query += ` ORDER BY 
            CASE 
                WHEN o.status = 'pending_coordinator' THEN 1 
                WHEN o.status = 'pending_hod' THEN 2
                ELSE 3 
            END,
            o.created_at DESC`;

        const result = await db.pool.query(query, params);
        res.json({ odRequests: result.rows });
    } catch (error) {
        console.error('Get OD requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a new OD request
router.post('/', authenticate, authorize('student'), [
    body('reason').trim().notEmpty(),
    body('start_date').isISO8601(),
    body('end_date').isISO8601(),
    body('total_days').isInt({ min: 1 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { reason, start_date, end_date, total_days } = req.body;

        const result = await db.pool.query(
            `INSERT INTO od_requests (user_id, reason, start_date, end_date, total_days, status)
       VALUES ($1, $2, $3, $4, $5, 'pending_coordinator')
       RETURNING *`,
            [req.user.id, reason, start_date, end_date, total_days]
        );

        res.status(201).json({ odRequest: result.rows[0] });
    } catch (error) {
        console.error('Create OD request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update OD request status
router.patch('/:id/status', authenticate, authorize('admin', 'faculty'), [
    body('status').isIn(['approved', 'rejected']), // Frontend sends 'approved'/'rejected', backend handles logic
    body('comment').optional().trim(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, comment } = req.body;
        const odId = req.params.id;
        const user = req.user;

        // Fetch current OD status
        const currentOd = await db.pool.query('SELECT status FROM od_requests WHERE id = $1', [odId]);
        if (currentOd.rows.length === 0) {
            return res.status(404).json({ message: 'OD request not found' });
        }
        const currentStatus = currentOd.rows[0].status;

        let newStatus = status;

        if (user.role === 'admin') {
            // Admin can force status
            newStatus = status; // 'approved' or 'rejected'
        } else if (user.role === 'faculty') {
            if (status === 'rejected') {
                newStatus = 'rejected';
            } else if (status === 'approved') {
                // Workflow logic
                if (user.designation === 'coordinator' && currentStatus === 'pending_coordinator') {
                    newStatus = 'pending_hod';
                } else if (user.designation === 'hod') {
                    // HOD can approve at any stage
                    newStatus = 'approved';
                } else {
                    return res.status(403).json({ message: 'You are not authorized to perform this action at this stage.' });
                }
            }
        }

        const result = await db.pool.query(
            `UPDATE od_requests 
       SET status = $1, comment = $2, action_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
            [newStatus, comment || null, req.user.id, odId]
        );

        res.json({ odRequest: result.rows[0] });
    } catch (error) {
        console.error('Update OD request status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete OD request (Student only, if pending)
router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
    try {
        const odId = req.params.id;
        const userId = req.user.id;

        // Check if OD exists and belongs to user
        const checkQuery = 'SELECT * FROM od_requests WHERE id = $1 AND user_id = $2';
        const checkResult = await db.pool.query(checkQuery, [odId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'OD request not found or unauthorized' });
        }

        const odRequest = checkResult.rows[0];

        // Check if status allows deletion
        if (odRequest.status !== 'pending_coordinator' && odRequest.status !== 'pending_hod') {
            return res.status(400).json({ message: 'Cannot delete OD request that is already processed' });
        }

        // Delete
        await db.pool.query('DELETE FROM od_requests WHERE id = $1', [odId]);

        res.json({ message: 'OD request deleted successfully' });
    } catch (error) {
        console.error('Delete OD request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
