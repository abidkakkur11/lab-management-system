import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, AlertTriangle, Clock } from 'lucide-react';
import { facultyService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatBookingDate } from '../../utils/dateUtils';

export const FacultyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await facultyService.getRequests();
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await facultyService.approveRequest(id);
      setMsg('Request successfully approved.');
      fetchRequests();
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
      setMsg('Request rejected.');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Special Booking Approval Requests</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Review student requests requiring special hardware access, administrative terminal rights, or extended hours.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading pending requests..." />
      ) : requests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No pending requests"
            message="All special lab booking requests have been reviewed."
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Student</th>
                <th>Laboratory & Seat</th>
                <th>Date & Time</th>
                <th>Special Request Justification</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{r.bookingId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{r.userId?.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.userId?.department}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{r.labId?.labName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.seatNumber ? `Terminal ${r.seatNumber} (Seat ${r.seatId})` : `Seat ${r.seatId}`}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{formatBookingDate(r.bookingDate)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.timeSlot.startTime} - {r.timeSlot.endTime}
                    </div>
                  </td>
                  <td>
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', maxWidth: '300px' }}>
                      {r.specialRequests}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
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
                        <Check size={14} /> Approve
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
  );
};
