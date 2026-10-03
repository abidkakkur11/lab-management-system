import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Clock,
  Search,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { adminService, labService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { formatBookingDate } from '../../utils/dateUtils';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [labs, setLabs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conflictLoading, setConflictLoading] = useState(false);

  // Filters
  const [date, setDate] = useState('');
  const [labId, setLabId] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Details
  const [inspectBooking, setInspectBooking] = useState(null);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const [bookingsRes, labsRes] = await Promise.all([
        adminService.getAllBookings({ date, labId, status, search }),
        labService.getLabs(),
      ]);

      if (bookingsRes.data?.success) setBookings(bookingsRes.data.data);
      if (labsRes.data?.success) setLabs(labsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const auditConflicts = async () => {
    try {
      setConflictLoading(true);
      const res = await adminService.getConflicts();
      if (res.data?.success) {
        setConflicts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConflictLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
    auditConflicts();
  }, [date, labId, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllBookings();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Master Booking Log & Conflict Audit</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Inspect all campus lab reservations, track attendance compliance, and detect schedule overlaps.
        </p>
      </div>

      {/* Conflict Audit Banner */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '24px', backgroundColor: conflicts.length > 0 ? '#fef2f2' : '#ecfdf5', borderColor: conflicts.length > 0 ? '#fecaca' : '#a7f3d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {conflicts.length > 0 ? (
              <AlertTriangle size={24} style={{ color: '#dc2626' }} />
            ) : (
              <ShieldCheck size={24} style={{ color: '#059669' }} />
            )}
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: conflicts.length > 0 ? '#991b1b' : '#065f46' }}>
                {conflicts.length > 0
                  ? `${conflicts.length} Overlapping Schedule Conflicts Detected`
                  : 'All Workstation Schedules Conflict-Free'}
              </div>
              <div style={{ fontSize: '0.8rem', color: conflicts.length > 0 ? '#b91c1c' : '#047857' }}>
                {conflicts.length > 0
                  ? 'Overlapping reservations exist for the same workstation and time range.'
                  : 'Automated collision audit verified: No overlapping terminal reservations exist in the database.'}
              </div>
            </div>
          </div>

          <button onClick={auditConflicts} className="btn btn-secondary btn-sm" disabled={conflictLoading}>
            {conflictLoading ? 'Auditing...' : 'Run Collision Audit'}
          </button>
        </div>

        {/* Display conflicts table if any */}
        {conflicts.length > 0 && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #fecaca', paddingTop: '12px' }}>
            {conflicts.map((c, idx) => (
              <div key={idx} style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '6px' }}>
                • <strong>{c.labName} (Seat {c.seatId})</strong> on {c.bookingDate}: Conflict between{' '}
                <code>{c.booking1.id}</code> ({c.booking1.user}, {c.booking1.time}) and{' '}
                <code>{c.booking2.id}</code> ({c.booking2.user}, {c.booking2.time})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Laboratory</label>
              <select className="form-select" value={labId} onChange={(e) => setLabId(e.target.value)}>
                <option value="all">All Labs</option>
                {labs.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.labName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                Filter Bookings
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving booking logs..." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Student</th>
                <th>Laboratory & Seat</th>
                <th>Date & Slot</th>
                <th>Purpose</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{b.bookingId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{b.userId?.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.userId?.department}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{b.labId?.labName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.seatNumber ? `Terminal ${b.seatNumber} (Seat ${b.seatId})` : `Seat ${b.seatId}`}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{formatBookingDate(b.bookingDate)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.timeSlot.startTime} - {b.timeSlot.endTime}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.purpose}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setInspectBooking(b)}
                      className="btn btn-secondary btn-sm"
                      title="Inspect record"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Modal */}
      <Modal
        isOpen={Boolean(inspectBooking)}
        onClose={() => setInspectBooking(null)}
        title={`Audit Record • ${inspectBooking?.bookingId}`}
      >
        {inspectBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`badge badge-${inspectBooking.status}`}>{inspectBooking.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
              <span style={{ fontWeight: '600' }}>{inspectBooking.userId?.userName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Student Email:</span>
              <span>{inspectBooking.userId?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Laboratory:</span>
              <span>{inspectBooking.labId?.labName}</span>
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
                {formatBookingDate(inspectBooking.bookingDate)} ({inspectBooking.timeSlot.startTime} - {inspectBooking.timeSlot.endTime})
              </span>
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
          </div>
        )}
      </Modal>
    </div>
  );
};
