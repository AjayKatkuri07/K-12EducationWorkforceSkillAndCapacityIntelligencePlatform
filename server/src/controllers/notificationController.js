import { Notification } from '../models/store.js';

export async function getNotifications(req, res, next) {
  try {
    const userRole = req.user?.role || 'Employee';
    const userId = req.user?.id;

    // Filter by role or recipient
    const notifications = await Notification.find();
    const relevant = notifications.filter(n =>
      n.recipientRole === 'All' ||
      n.recipientRole === userRole ||
      n.recipientId === userId
    );

    // Sort newest first
    relevant.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = relevant.filter(n => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      total: relevant.length,
      data: relevant
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const notifications = await Notification.find();
    for (const notif of notifications) {
      if (!notif.read) {
        await Notification.findByIdAndUpdate(notif.id || notif._id, { read: true });
      }
    }
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}
