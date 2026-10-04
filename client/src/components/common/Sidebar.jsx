import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  FolderGit2,
  Users2,
  Handshake,
  Bell,
  User,
  Clock,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldAlert,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const role = user?.userType || 'student';

  const studentLinks = [
    { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Labs & Seats', to: '/student/labs', icon: Building2 },
    { label: 'My Bookings', to: '/student/bookings', icon: Clock },
    { label: 'Calendar', to: '/student/calendar', icon: CalendarDays },
    { label: 'Academic Projects', to: '/student/projects', icon: FolderGit2 },
    { label: 'Find Peers', to: '/student/peers', icon: Users2 },
    { label: 'Collaboration', to: '/student/collaborations', icon: Handshake },
    { label: 'Notifications', to: '/student/notifications', icon: Bell },
    { label: 'My Profile', to: '/student/profile', icon: User },
  ];

  const facultyLinks = [
    { label: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Lab Schedules', to: '/faculty/schedules', icon: CalendarDays },
    { label: 'Student Activity', to: '/faculty/students', icon: Users2 },
    { label: 'Special Requests', to: '/faculty/requests', icon: CheckSquare },
    { label: 'Usage Reports', to: '/faculty/reports', icon: BarChart3 },
    { label: 'Notifications', to: '/faculty/notifications', icon: Bell },
    { label: 'Faculty Profile', to: '/faculty/profile', icon: User },
  ];

  const adminLinks = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Users', to: '/admin/users', icon: Users2 },
    { label: 'Manage Labs', to: '/admin/labs', icon: Building2 },
    { label: 'Departments', to: '/admin/departments', icon: GraduationCap },
    { label: 'All Bookings', to: '/admin/bookings', icon: ClipboardList },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Announcements', to: '/admin/notifications', icon: Bell },
    { label: 'System Settings', to: '/admin/settings', icon: Settings },
    { label: 'Admin Profile', to: '/admin/profile', icon: User },
  ];

  const links = role === 'admin' ? adminLinks : role === 'faculty' ? facultyLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 45,
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px 20px 12px 20px' }}>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-subtle)',
            }}
          >
            {role.toUpperCase()} PORTAL
          </span>
        </div>

        <nav style={{ flex: 1, paddingBottom: '24px', overflowY: 'auto' }}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom of Sidebar */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            {user?.userName?.charAt(0) || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.825rem',
                fontWeight: '600',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.userName}
            </div>
            <div
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
