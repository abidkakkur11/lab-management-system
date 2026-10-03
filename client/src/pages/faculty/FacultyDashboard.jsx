import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  CheckSquare,
  Users,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { facultyService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatBookingDate } from '../../utils/dateUtils';

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await facultyService.getDashboard();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await facultyService.approveRequest(id);
      setMsg('Special booking request approved.');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter decline reason:');
    if (reason === null) return;

    try {
      setActionLoading(true);
      await facultyService.rejectRequest(id, { reason });
      setMsg('Special booking request rejected.');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveStudent = async (studentId) => {
    try {
      setActionLoading(true);
      const res = await facultyService.approveStudent(studentId);
      setMsg(res.data?.message || 'Student verified and approved.');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectStudent = async (studentId) => {
    const reason = prompt('Please enter reason for declining student registration:');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await facultyService.rejectStudent(studentId, { reason });
      setMsg(res.data?.message || 'Student registration declined.');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) return <LoadingSpinner text="Compiling faculty monitoring telemetry..." />;

  const {
    metrics,
    todayBookings = [],
    pendingRequests = [],
    pendingStudents = [],
    activeCheckIns = [],
    recentActivity = [],
  } = data || {};

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Faculty Laboratory Operations</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Real-time session oversight, student registration verification, and laboratory utilization analytics.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            marginBottom: '20px',
            fontSize: '0.85rem',
          }}
        >
          {msg}
        </div>
      )}

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Today's Bookings</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{metrics?.todayBookingsCount || 0}</div>
            <div style={{ fontSize: '0.725rem', color: '#2563eb' }}>Scheduled sessions</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Student Approvals</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{metrics?.pendingStudentsCount || 0}</div>
            <div style={{ fontSize: '0.725rem', color: '#b45309' }}>Awaiting verification</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Bookings</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{metrics?.pendingRequestsCount || 0}</div>
            <div style={{ fontSize: '0.725rem', color: '#d97706' }}>Booking requests</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Currently In Lab</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{metrics?.activeCheckedInCount || 0}</div>
            <div style={{ fontSize: '0.725rem', color: '#059669' }}>Active check-ins</div>
          </div>
        </div>
      </div>

      {/* Pending Student Registrations Verification Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Student Department Registrations • Pending Verification</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Students in your department awaiting faculty approval before accessing college laboratories
            </p>
          </div>
          <span className="badge badge-reserved">{pendingStudents.length} Pending</span>
        </div>

        {pendingStudents.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No student registrations currently pending verification in your department.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Year of Study</th>
                  <th>Department</th>
                  <th>Registered Date</th>
                  <th style={{ textAlign: 'right' }}>Faculty Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: '600' }}>{s.userName}</td>
                    <td>{s.email}</td>
                    <td>{s.yearOfStudy}</td>
                    <td>{s.department}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatBookingDate(s.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRejectStudent(s._id)}
                          className="btn btn-secondary btn-sm"
                          disabled={actionLoading}
                          title="Decline student verification"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleApproveStudent(s._id)}
                          className="btn btn-success btn-sm"
                          disabled={actionLoading}
                          title="Approve student for lab access"
                        >
                          <Check size={14} /> Verify & Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Grid: Pending Approval Requests & Active Checked In */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Special Requests Review */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Pending Booking Confirmation Requests</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Student lab seat reservations assigned to you for verification
              </p>
            </div>
            <Link to="/faculty/requests" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
              View All
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No pending booking requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingRequests.slice(0, 4).map((r) => (
                <div
                  key={r._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fde68a',
                    backgroundColor: '#fffbeb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.userId?.userName}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#92400e' }}>
                      {formatBookingDate(r.bookingDate)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '6px' }}>
                    {r.labId?.labName} • Seat {r.seatNumber || r.seatId} ({r.timeSlot.startTime} - {r.timeSlot.endTime})
                  </div>
                  {r.specialRequests && (
                    <div style={{ fontSize: '0.8rem', color: '#78350f', backgroundColor: '#fef3c7', padding: '6px 8px', borderRadius: '4px', marginBottom: '10px' }}>
                      <strong>Special Request:</strong> {r.specialRequests}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleReject(r._id)}
                      className="btn btn-secondary btn-sm"
                      disabled={actionLoading}
                    >
                      <X size={14} /> Decline
                    </button>
                    <button
                      onClick={() => handleApprove(r._id)}
                      className="btn btn-success btn-sm"
                      disabled={actionLoading}
                    >
                      <Check size={14} /> Approve Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently Checked In Students */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Active Checked-In Students</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live laboratory floor presence</p>
            </div>
            <Link to="/faculty/schedules" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
              Full Schedule
            </Link>
          </div>

          {activeCheckIns.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No students are currently checked in.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeCheckIns.map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.userId?.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.labId?.labName} • Seat {item.seatId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                      In Lab
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      In at {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
