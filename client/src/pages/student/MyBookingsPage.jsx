import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckSquare,
  LogOut,
  Trash2,
  Eye,
} from 'lucide-react';
import { bookingService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { formatBookingDate } from '../../utils/dateUtils';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Cancel dialog state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [inspectBooking, setInspectBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings({
        status: activeTab === 'all' ? undefined : activeTab,
      });
      if (res.data?.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleCheckIn = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await bookingService.checkIn(bookingId);
      if (res.data?.success) {
        setMessage({ text: 'Checked in successfully! Enjoy your lab session.', type: 'success' });
        fetchBookings();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Check-in failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await bookingService.checkOut(bookingId);
      if (res.data?.success) {
        setMessage({ text: 'Checked out successfully. Session completed.', type: 'success' });
        fetchBookings();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Check-out failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = (bkg) => {
    setSelectedBooking(bkg);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      const res = await bookingService.cancelBooking(selectedBooking._id);
      if (res.data?.success) {
        setMessage({ text: 'Booking cancelled successfully. Seat is now available for other students.', type: 'success' });
        setCancelModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to cancel booking.', type: 'error' });
      setCancelModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (bkg) => {
    setInspectBooking(bkg);
    setDetailsModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>My Laboratory Bookings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage active sessions, perform terminal check-ins, and view historical reservation records.
          </p>
        </div>

        <Link to="/student/labs" className="btn btn-primary">
          <Building2 size={16} />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#065f46' : '#b91c1c',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Table / List */}
      {loading ? (
        <LoadingSpinner text="Retrieving booking records..." />
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No reservations found"
            message={`You currently have no ${activeTab === 'all' ? '' : activeTab} bookings.`}
            action={
              <Link to="/student/labs" className="btn btn-primary">
                Book a Workstation
              </Link>
            }
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Laboratory & Seat</th>
                <th>Date & Time</th>
                <th>Purpose</th>
                <th>Check-in Status</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isUpcomingOrToday = b.bookingDate >= todayStr;
                const canCancel = ['confirmed', 'pending'].includes(b.status) && isUpcomingOrToday;
                const canCheckIn =
                  b.status === 'confirmed' &&
                  b.bookingDate === todayStr &&
                  !b.checkInTime;
                const canCheckOut =
                  b.status === 'confirmed' &&
                  b.checkInTime &&
                  !b.checkOutTime;

                return (
                  <tr key={b._id}>
                    <td>
                      <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                        {b.bookingId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.labId?.labName || 'Laboratory'}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {b.seatNumber ? `Terminal ${b.seatNumber} (Seat ${b.seatId})` : `Seat ${b.seatId}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{formatBookingDate(b.bookingDate)}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {b.timeSlot.startTime} - {b.timeSlot.endTime} ({b.timeSlot.duration}m)
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {b.purpose}
                      </div>
                    </td>
                    <td>
                      {b.checkInTime ? (
                        <span style={{ fontSize: '0.775rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} />
                          Checked In {b.checkOutTime && '• Out'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          Not Checked In
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openDetails(b)}
                          className="btn btn-secondary btn-sm"
                          title="Inspect Details"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Check In Action */}
                        {canCheckIn && (
                          <button
                            onClick={() => handleCheckIn(b._id)}
                            className="btn btn-success btn-sm"
                            disabled={actionLoading}
                            title="Check In to Session"
                          >
                            <CheckSquare size={14} />
                            <span>Check In</span>
                          </button>
                        )}

                        {/* Check Out Action */}
                        {canCheckOut && (
                          <button
                            onClick={() => handleCheckOut(b._id)}
                            className="btn btn-secondary btn-sm"
                            disabled={actionLoading}
                            title="Complete Session & Check Out"
                          >
                            <LogOut size={14} />
                            <span>Check Out</span>
                          </button>
                        )}

                        {/* Cancellation Action */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelClick(b)}
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading}
                            title="Cancel Booking"
                          >
                            <XCircle size={14} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel this booking?"
        message={`Are you sure you want to cancel reservation ${selectedBooking?.bookingId} for Seat ${selectedBooking?.seatId}? The slot will immediately become available for other students.`}
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Booking Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Booking Record • ${inspectBooking?.bookingId}`}
      >
        {inspectBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`badge badge-${inspectBooking.status}`}>{inspectBooking.status}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Laboratory:</span>
              <span style={{ fontWeight: '600' }}>{inspectBooking.labId?.labName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Workstation / Terminal:</span>
              <span style={{ fontWeight: '600' }}>
                {inspectBooking.seatNumber ? `Terminal ${inspectBooking.seatNumber} (Seat ${inspectBooking.seatId})` : `Seat ${inspectBooking.seatId}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Slot:</span>
              <span style={{ fontWeight: '600' }}>
                {formatBookingDate(inspectBooking.bookingDate)} ({inspectBooking.timeSlot?.startTime} - {inspectBooking.timeSlot?.endTime})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
              <span>{inspectBooking.timeSlot?.duration} minutes</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Session Purpose:</span>
              <p style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                {inspectBooking.purpose}
              </p>
            </div>

            {inspectBooking.specialRequests && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Special Requests:</span>
                <p style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', color: '#92400e' }}>
                  {inspectBooking.specialRequests}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Check-In Time:</span>
              <span>{inspectBooking.checkInTime ? new Date(inspectBooking.checkInTime).toLocaleTimeString() : 'Not yet'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Check-Out Time:</span>
              <span>{inspectBooking.checkOutTime ? new Date(inspectBooking.checkOutTime).toLocaleTimeString() : 'Not yet'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
