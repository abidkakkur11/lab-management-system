import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  FolderGit2,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { labService, bookingService, projectService, userService, notificationService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatBookingDate } from '../../utils/dateUtils';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [peers, setPeers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [labsRes, bookingsRes, projectsRes, peersRes, notifsRes] = await Promise.all([
          labService.getLabs({ limit: 4 }),
          bookingService.getMyBookings({ limit: 5 }),
          projectService.getProjects({ limit: 4 }),
          userService.getPeers({ limit: 3 }),
          notificationService.getMyNotifications(),
        ]);

        if (labsRes.data?.success) setLabs(labsRes.data.data);
        if (bookingsRes.data?.success) setMyBookings(bookingsRes.data.data);
        if (projectsRes.data?.success) setProjects(projectsRes.data.data);
        if (peersRes.data?.success) setPeers(peersRes.data.data.slice(0, 3));
        if (notifsRes.data?.success) setNotifications(notifsRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading your student workspace..." />;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = myBookings.filter((b) => b.bookingDate === todayStr && b.status !== 'cancelled');
  const upcomingBooking = myBookings.find(
    (b) => b.bookingDate >= todayStr && ['confirmed', 'pending'].includes(b.status)
  );

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            Welcome back, {user?.userName?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {user?.department} • {user?.yearOfStudy} • Ready for laboratory research and development
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/student/labs" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Book a Lab Seat</span>
          </Link>
          <Link to="/student/projects/new" className="btn btn-secondary">
            <FolderGit2 size={16} />
            <span>New Academic Project</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Available Labs */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Active Laboratories
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{labs.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#059669' }}>Fully Operational</div>
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Today's Sessions
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>
              {todayBookings.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Scheduled for today</div>
          </div>
        </div>

        {/* Next Upcoming Booking */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Upcoming Seat
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1.2, color: 'var(--primary)' }}>
              {upcomingBooking
                ? (upcomingBooking.seatNumber ? `${upcomingBooking.seatNumber} (${upcomingBooking.seatId})` : `Seat ${upcomingBooking.seatId}`)
                : 'None'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {upcomingBooking
                ? `${formatBookingDate(upcomingBooking.bookingDate)} (${upcomingBooking.timeSlot.startTime})`
                : 'No pending booking'}
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderGit2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Active Projects
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>
              {projects.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c3aed' }}>In campus ecosystem</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Bookings & Recommended Peers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Bookings Section */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Recent & Upcoming Bookings</h3>
            <Link to="/student/bookings" style={{ fontSize: '0.825rem', fontWeight: '600' }}>
              View All
            </Link>
          </div>

          {myBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.875rem' }}>No bookings made yet.</p>
              <Link to="/student/labs" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                Explore Labs
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myBookings.slice(0, 4).map((b) => (
                <div
                  key={b._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {b.labId?.labName || 'Laboratory'} • {b.seatNumber ? `Terminal ${b.seatNumber} (Seat ${b.seatId})` : `Seat ${b.seatId}`}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatBookingDate(b.bookingDate)} • {b.timeSlot.startTime} - {b.timeSlot.endTime}
                    </div>
                  </div>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peer Discovery Highlights */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Recommended Peer Collaborators</h3>
            </div>
            <Link to="/student/peers" style={{ fontSize: '0.825rem', fontWeight: '600' }}>
              Find Peers
            </Link>
          </div>

          {peers.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No peers discovered yet. Add skills in your profile to improve matching!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {peers.map((peer) => (
                <div
                  key={peer._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{peer.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {peer.department} • {peer.skills?.slice(0, 3).join(', ')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>
                      {peer.matchExplanation}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        display: 'block',
                      }}
                    >
                      {peer.matchScore}% Match
                    </span>
                    <Link
                      to="/student/peers"
                      style={{ fontSize: '0.75rem', textDecoration: 'underline' }}
                    >
                      Connect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Lab Discovery Section */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Available College Laboratories</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time calculated workstation availability
            </p>
          </div>
          <Link to="/student/labs" className="btn btn-secondary btn-sm">
            View All Labs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="labs-grid">
          {labs.map((lab) => (
            <div
              key={lab._id}
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{lab.labName}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {lab.department} • {lab.location}
              </div>

              {/* Status pill counts */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <span className="badge badge-available">
                  {lab.stats?.available || 0} Available
                </span>
                <span className="badge badge-reserved">
                  {lab.stats?.reserved || 0} Reserved
                </span>
                <span className="badge badge-occupied">
                  {lab.stats?.occupied || 0} Occupied
                </span>
              </div>

              <Link to={`/student/labs/${lab._id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                View Graphical Seat Layout
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
