import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Shield, Calendar, Users, Info } from 'lucide-react';
import { notificationService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useSocket } from '../../context/SocketContext';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data);
        const unread = (res.data.data || []).filter((n) => !n.isRead).length;
        window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: unread } }));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Socket listener for incoming notifications
  useEffect(() => {
    if (!socket) return;

    const handleNew = () => {
      fetchNotifications();
    };

    socket.on('new_notification', handleNew);
    socket.on('system_announcement', handleNew);

    return () => {
      socket.off('new_notification', handleNew);
      socket.off('system_announcement', handleNew);
    };
  }, [socket]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        const unread = next.filter((n) => !n.isRead).length;
        window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: unread } }));
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, isRead: true }));
        window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: 0 } }));
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const next = prev.filter((n) => n._id !== id);
        const unread = next.filter((n) => !n.isRead).length;
        window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: unread } }));
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar size={18} style={{ color: '#2563eb' }} />;
      case 'collaboration':
        return <Users size={18} style={{ color: '#7c3aed' }} />;
      default:
        return <Info size={18} style={{ color: '#059669' }} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Notifications & Alerts</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            System updates, workstation booking confirmations, and team collaboration alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching notification logs..." />
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="All caught up!"
            message="You have no notifications in your inbox right now."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: n.isRead ? 'var(--bg-card)' : '#f8faff',
                borderLeft: n.isRead ? '1px solid var(--border-light)' : '4px solid var(--primary)',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(n.type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{n.title}</h4>
                    <span
                      className={`badge badge-${
                        n.priority === 'high' ? 'cancelled' : n.priority === 'low' ? 'unavailable' : 'occupied'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {n.priority}
                    </span>
                    {!n.isRead && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                        }}
                      />
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4, margin: '4px 0' }}>
                    {n.message}
                  </p>

                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="btn btn-secondary btn-sm"
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#dc2626' }}
                  title="Remove notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
