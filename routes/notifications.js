const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
});

// Create a notification (for testing/demo)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, type } = req.body;
    const notification = new Notification({
      user: req.user._id,
      message,
      type: type || 'info',
    });
    await notification.save();
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
});

module.exports = router; 