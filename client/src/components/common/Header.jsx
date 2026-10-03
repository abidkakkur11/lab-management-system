import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User as UserIcon, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/api';

export const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // quiet fail
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnread();
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotif);
    socket.on('system_announcement', handleNewNotif);

    return () => {
      socket.off('new_notification', handleNewNotif);
      socket.off('system_announcement', handleNewNotif);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileLink = () => {
    if (user?.userType === 'admin') return '/admin/profile';
    if (user?.userType === 'faculty') return '/faculty/profile';
    return '/student/profile';
  };

  const getNotificationsLink = () => {
    if (user?.userType === 'student') return '/student/notifications';
    if (user?.userType === 'admin') return '/admin/notifications';
    return '/student/notifications';
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }}
          id="mobile-sidebar-toggle"
          title="Toggle Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1.1rem',
            }}
          >
            L
          </div>
          <div>
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              LabPulse
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              College Lab System
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Role Badge */}
        <span
          className="badge"
          style={{
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            backgroundColor:
              user?.userType === 'admin'
                ? '#fef3c7'
                : user?.userType === 'faculty'
                ? '#f3e8ff'
                : '#e0f2fe',
            color:
              user?.userType === 'admin'
                ? '#92400e'
                : user?.userType === 'faculty'
                ? '#6b21a8'
                : '#0369a1',
          }}
        >
          <Shield size={12} />
          {user?.userType}
        </span>

        {/* Notifications Icon with Badge */}
        <Link
          to={getNotificationsLink()}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative', padding: '8px 10px', borderRadius: '8px' }}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '2px 5px',
                borderRadius: '999px',
                minWidth: '16px',
                textAlign: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile */}
        <Link
          to={getProfileLink()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              overflow: 'hidden',
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.userName?.charAt(0) || 'U'
            )}
          </div>
          <div style={{ display: 'none', flexDirection: 'column' }} className="user-info-text">
            <span style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.2 }}>
              {user?.userName}
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              {user?.department}
            </span>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
          title="Log Out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
