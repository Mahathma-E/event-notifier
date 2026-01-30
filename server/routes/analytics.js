const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', authenticate, authorize('admin', 'faculty'), async (req, res) => {
  try {
    // Total notifications
    const totalNotifications = await db.pool.query(
      'SELECT COUNT(*) as total FROM notifications'
    );

    // Notifications by category
    const byCategory = await db.pool.query(
      `SELECT category, COUNT(*) as count
       FROM notifications
       GROUP BY category
       ORDER BY count DESC`
    );

    // Notifications by priority
    const byPriority = await db.pool.query(
      `SELECT priority, COUNT(*) as count
       FROM notifications
       GROUP BY priority
       ORDER BY 
         CASE priority
           WHEN 'Emergency' THEN 1
           WHEN 'High' THEN 2
           WHEN 'Normal' THEN 3
           WHEN 'Info' THEN 4
         END`
    );

    // Notifications by department
    const byDepartment = await db.pool.query(
      `SELECT d.name as department_name, COUNT(n.id) as count
       FROM departments d
       LEFT JOIN notifications n ON d.id = n.department_id
       GROUP BY d.id, d.name
       ORDER BY count DESC`
    );

    // Read and acknowledgment statistics
    const readStats = await db.pool.query(
      `SELECT 
         COUNT(DISTINCT n.id) as total_notifications,
         COUNT(DISTINCT a.notification_id) as notifications_with_reads,
         COUNT(DISTINCT CASE WHEN a.status = 'read' THEN a.user_id END) as total_reads,
         COUNT(DISTINCT CASE WHEN a.status = 'acknowledged' THEN a.user_id END) as total_acknowledgments
       FROM notifications n
       LEFT JOIN acknowledgments a ON n.id = a.notification_id`
    );

    // Recent notifications with engagement
    const recentNotifications = await db.pool.query(
      `SELECT 
         n.id, n.title, n.category, n.priority, n.created_at,
         COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'read') as read_count,
         COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'acknowledged') as acknowledged_count
       FROM notifications n
       LEFT JOIN acknowledgments a ON n.id = a.notification_id
       GROUP BY n.id, n.title, n.category, n.priority, n.created_at
       ORDER BY n.created_at DESC
       LIMIT 10`
    );

    // Daily notification trend (last 30 days)
    const dailyTrend = await db.pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count
       FROM notifications
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Department-wise reach
    const departmentReach = await db.pool.query(
      `SELECT 
         d.name as department_name,
         COUNT(DISTINCT n.id) as notification_count,
         COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'read') as read_count,
         COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'acknowledged') as acknowledged_count
       FROM departments d
       LEFT JOIN notifications n ON d.id = n.department_id
       LEFT JOIN acknowledgments a ON n.id = a.notification_id
       GROUP BY d.id, d.name
       HAVING COUNT(DISTINCT n.id) > 0
       ORDER BY notification_count DESC`
    );

    res.json({
      totalNotifications: parseInt(totalNotifications.rows[0].total),
      byCategory: byCategory.rows,
      byPriority: byPriority.rows,
      byDepartment: byDepartment.rows,
      readStats: readStats.rows[0],
      recentNotifications: recentNotifications.rows,
      dailyTrend: dailyTrend.rows,
      departmentReach: departmentReach.rows
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification-specific analytics
router.get('/notification/:id', authenticate, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Check if notification exists
    const notification = await db.pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Get total target users
    let targetQuery = 'SELECT COUNT(*) as total FROM users WHERE role = $1';
    const targetParams = ['student'];

    if (notification.rows[0].department_id) {
      targetQuery += ` AND (department_id = $2 OR department_id IS NULL)`;
      targetParams.push(notification.rows[0].department_id);
    }
    if (notification.rows[0].year) {
      targetQuery += ` AND (year = $${targetParams.length + 1} OR year IS NULL)`;
      targetParams.push(notification.rows[0].year);
    }

    const targetUsers = await db.pool.query(targetQuery, targetParams);
    const totalTarget = parseInt(targetUsers.rows[0].total);

    // Get read and acknowledgment counts
    const stats = await db.pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'read') as read_count,
         COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count
       FROM acknowledgments
       WHERE notification_id = $1`,
      [notificationId]
    );

    const readCount = parseInt(stats.rows[0].read_count || 0);
    const acknowledgedCount = parseInt(stats.rows[0].acknowledged_count || 0);

    // Get user-wise acknowledgment details
    const userDetails = await db.pool.query(
      `SELECT 
         u.id, u.name, u.email, u.department_id, u.year,
         d.name as department_name,
         a.status, a.read_at, a.acknowledged_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN acknowledgments a ON a.notification_id = $1 AND a.user_id = u.id
       WHERE u.role = 'student'
       ORDER BY a.acknowledged_at DESC NULLS LAST, a.read_at DESC NULLS LAST, u.name`
    );

    res.json({
      notification: notification.rows[0],
      totalTarget,
      readCount,
      acknowledgedCount,
      readPercentage: totalTarget > 0 ? ((readCount / totalTarget) * 100).toFixed(2) : 0,
      acknowledgedPercentage: totalTarget > 0 ? ((acknowledgedCount / totalTarget) * 100).toFixed(2) : 0,
      userDetails: userDetails.rows
    });
  } catch (error) {
    console.error('Notification analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
