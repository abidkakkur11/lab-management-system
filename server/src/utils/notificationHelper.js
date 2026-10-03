const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets/socketHandler');

const createNotification = async ({ userId, type = 'system', title, message, relatedId = '', priority = 'medium' }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      priority,
    });

    // Real-time socket emit
    emitToUser(userId.toString(), 'new_notification', notification);

    return notification;
  } catch (error) {
    console.error('[Notification Helper Error]', error.message);
    return null;
  }
};

module.exports = { createNotification };
