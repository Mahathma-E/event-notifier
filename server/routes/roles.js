const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all roles
router.get('/', authenticate, async (req, res) => {
    try {
        let query = 'SELECT * FROM roles';
        const params = [];

        // If not admin, only show public roles
        if (req.user.role !== 'admin') {
            query += ' WHERE is_public = TRUE';
        }

        query += ' ORDER BY name ASC';

        const result = await db.pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new role (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, color, description, is_public } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        // Check if role exists
        const existing = await db.pool.query('SELECT id FROM roles WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const result = await db.pool.query(
            `INSERT INTO roles (name, color, description, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, color || '#3B82F6', description, is_public || false, req.user.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a role (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, color, description, is_public } = req.body;
        const { id } = req.params;

        const result = await db.pool.query(
            `UPDATE roles 
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           description = COALESCE($3, description),
           is_public = COALESCE($4, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
            [name, color, description, is_public, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a role (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.pool.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Assign a role to a user (Admin or Faculty/Sub-admin)
router.post('/users/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;

        // Check permissions
        if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify role exists and is public if assigner is not admin
        const roleCheck = await db.pool.query('SELECT * FROM roles WHERE id = $1', [roleId]);
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        const role = roleCheck.rows[0];

        if (req.user.role !== 'admin' && !role.is_public) {
            return res.status(403).json({ message: 'Cannot assign private roles' });
        }

        // Assign role
        await db.pool.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
            [userId, roleId, req.user.id]
        );

        res.json({ message: 'Role assigned successfully' });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove a role from a user
router.delete('/users/:userId/:roleId', authenticate, async (req, res) => {
    try {
        const { userId, roleId } = req.params;

        // Check permissions
        if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // If faculty, check if role is public
        if (req.user.role !== 'admin') {
            const roleCheck = await db.pool.query('SELECT is_public FROM roles WHERE id = $1', [roleId]);
            if (roleCheck.rows.length > 0 && !roleCheck.rows[0].is_public) {
                return res.status(403).json({ message: 'Cannot remove private roles' });
            }
        }

        await db.pool.query(
            'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );

        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        console.error('Error removing role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
