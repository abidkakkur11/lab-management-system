import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Users,
  Wrench,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { labService, bookingService, userService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useSocket } from '../../context/SocketContext';
import { formatBookingDate } from '../../utils/dateUtils';

export const LabDetailPage = () => {
  const { labId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Query parameter defaults
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialStart = searchParams.get('start') || '10:00';
  const initialEnd = searchParams.get('end') || '12:00';

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);

  const [loading, setLoading] = useState(true);
  const [labData, setLabData] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Faculty selection state
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Booking Form State
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState('');
  const [equipment, setEquipment] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await labService.getLabAvailability(labId, {
        date,
        startTime,
        endTime,
      });
      if (res.data?.success) {
        setLabData(res.data.data);

        // Fetch faculties for this laboratory's department
        const targetDept = res.data.data.department || res.data.data.lab?.department;
        if (targetDept) {
          try {
            const fRes = await userService.getFaculties({ department: targetDept });
            if (fRes.data?.success && fRes.data.data) {
              setFaculties(fRes.data.data);
              if (fRes.data.data.length > 0 && !selectedFacultyId) {
                setSelectedFacultyId(fRes.data.data[0]._id);
              }
            }
          } catch (facErr) {
            console.error('Error fetching department faculties:', facErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load lab availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [labId, date, startTime, endTime]);

  // Real-time socket room listening for booking updates in this lab
  useEffect(() => {
    if (!socket || !labId) return;

    socket.emit('join_lab_room', labId);

    const handleUpdate = (data) => {
      if (data.date === date) {
        fetchAvailability();
      }
    };

    socket.on('booking_slot_updated', handleUpdate);

    return () => {
      socket.emit('leave_lab_room', labId);
      socket.off('booking_slot_updated', handleUpdate);
    };
  }, [socket, labId, date]);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  const openBookingModal = () => {
    if (!selectedSeat || selectedSeat.status !== 'available') return;
    setBookingError('');
    setBookingSuccess(false);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setBookingError('Please describe the purpose of your lab session.');
      return;
    }

    // Client-side past time and date check
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const localTodayStr = `${localYear}-${localMonth}-${localDay}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (date < localTodayStr) {
      setBookingError('Cannot create bookings for past dates.');
      return;
    }

    if (date === localTodayStr && startMins <= currentMins) {
      const curH = String(now.getHours()).padStart(2, '0');
      const curM = String(now.getMinutes()).padStart(2, '0');
      setBookingError(`Cannot book a past or current time slot. Current local time is ${curH}:${curM}. Please choose a future start time.`);
      return;
    }

    if (startMins >= endMins) {
      setBookingError('End time must be after start time.');
      return;
    }

    if (!selectedFacultyId) {
      setBookingError('Please select a department faculty member to verify and approve your booking.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError('');

      const res = await bookingService.createBooking({
        labId,
        seatId: selectedSeat.seatId,
        facultyId: selectedFacultyId,
        bookingDate: date,
        startTime,
        endTime,
        purpose,
        attendees: attendees ? attendees.split(',').map((s) => s.trim()).filter(Boolean) : [],
        equipment: equipment ? equipment.split(',').map((s) => s.trim()).filter(Boolean) : [],
        specialRequests,
      });

      if (res.data?.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingModalOpen(false);
          navigate('/student/bookings');
        }, 1800);
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Failed to complete booking. Please try another slot or seat.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && !labData) {
    return <LoadingSpinner text="Computing graphical seat availability..." />;
  }

  const seats = labData?.layout?.seats || [];
  const gridWidth = labData?.layout?.width || 6;

  return (
    <div>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/student/labs')} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Laboratories
        </button>
      </div>

      {/* Lab Header Summary */}
      <div
        className="card"
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
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--primary)',
            }}
          >
            {labData?.department}
          </span>
          <h1 style={{ fontSize: '1.6rem', marginTop: '2px' }}>{labData?.labName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Terminal Capacity: {labData?.capacity} Seats</span>
          </div>
        </div>

        {/* Operating Hours Alert */}
        <div>
          {labData?.isWithinHours ? (
            <div className="badge badge-available" style={{ padding: '6px 12px' }}>
              <ShieldCheck size={14} />
              Open for Bookings ({labData?.operatingHours?.start} - {labData?.operatingHours?.end})
            </div>
          ) : (
            <div className="badge badge-cancelled" style={{ padding: '6px 12px' }}>
              <AlertTriangle size={14} />
              Outside Operating Hours ({labData?.operatingHours?.isOpen ? `${labData?.operatingHours?.start} - ${labData?.operatingHours?.end}` : 'Closed Today'})
            </div>
          )}
        </div>
      </div>

      {/* Time & Date Slot Selector Controls */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Reservation Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Time</label>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>End Time</label>
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
            <button
              onClick={fetchAvailability}
              className="btn btn-secondary"
              style={{ width: '100%' }}
              title="Refresh availability calculation"
            >
              Refresh Slot Availability
            </button>
          </div>
        </div>
      </div>

      {/* Main Seat Layout + Inspector Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Graphical Seat Visualizer */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Terminal Allocation Matrix</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any workstation to inspect
            </span>
          </div>

          <div className="seat-canvas">
            {/* Visual Screen / Projector Landmark */}
            <div className="screen-indicator">
              🖥️ Main Presentation Display & Instructor Console
            </div>

            {/* Dynamic Graphical Seat Layout */}
            <div
              className="seats-grid"
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
              }}
            >
              {seats.map((seat, index) => {
                const isSelected = selectedSeat?.seatId === seat.seatId;
                const seatIndex = index + 1;

                // Color mappings based on dynamic status
                let statusClass = 'seat-available';
                if (!seat.isWorking) statusClass = 'seat-unavailable';
                else if (seat.status === 'occupied') statusClass = 'seat-occupied';
                else if (seat.status === 'reserved') statusClass = 'seat-reserved';

                return (
                  <div
                    key={seat.seatId}
                    className={`seat-box ${statusClass} ${isSelected ? 'seat-selected' : ''}`}
                    onClick={() => handleSeatClick({ ...seat, seatIndex })}
                    title={`Seat ${seatIndex} - Terminal ${seat.seatNumber} (${seat.status})`}
                  >
                    <Monitor size={15} style={{ marginBottom: '1px' }} />
                    <span style={{ fontWeight: '800', fontSize: '0.74rem', lineHeight: '1.1' }}>
                      Seat {seatIndex}
                    </span>
                    <span style={{ fontSize: '0.67rem', opacity: 0.85, marginTop: '1px' }}>
                      {seat.seatNumber}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Visual Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: 'var(--status-available)', border: '1px solid var(--status-available-border)' }} />
                <span>Available ({labData?.counts?.available || 0})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: 'var(--status-reserved)', border: '1px solid var(--status-reserved-border)' }} />
                <span>Reserved / Pending ({labData?.counts?.reserved || 0})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: 'var(--status-occupied)', border: '1px solid var(--status-occupied-border)' }} />
                <span>Occupied ({labData?.counts?.occupied || 0})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: 'var(--status-unavailable)', border: '1px solid var(--status-unavailable-border)' }} />
                <span>Out of Order ({labData?.counts?.unavailable || 0})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Seat Inspector Panel */}
        <div className="card" style={{ position: 'sticky', top: '80px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
            Workstation Inspector
          </h3>

          {selectedSeat ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                    Seat {selectedSeat.seatIndex || (seats.findIndex((s) => s.seatId === selectedSeat.seatId) + 1)}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    Terminal: {selectedSeat.seatNumber}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Internal Matrix ID: {selectedSeat.seatId}
                  </div>
                </div>
                <span className={`badge badge-${selectedSeat.status}`}>
                  {selectedSeat.status}
                </span>
              </div>

              {/* Status Explanation */}
              <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {selectedSeat.status === 'available' && (
                  <p style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Workstation is ready and open for immediate booking.
                  </p>
                )}
                {selectedSeat.status === 'occupied' && (
                  <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', color: '#991b1b' }}>
                    <div style={{ fontWeight: '600' }}>Confirmed Booking:</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                      Reserved from {selectedSeat.booking?.startTime} to {selectedSeat.booking?.endTime}
                    </div>
                  </div>
                )}
                {selectedSeat.status === 'reserved' && (
                  <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', color: '#92400e' }}>
                    <div style={{ fontWeight: '600' }}>Pending Approval:</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                      Special session awaiting faculty review.
                    </div>
                  </div>
                )}
                {selectedSeat.status === 'unavailable' && (
                  <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', color: '#64748b' }}>
                    <div style={{ fontWeight: '600' }}>Hardware Maintenance:</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                      Terminal hardware is currently offline or undergoing servicing.
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Timeslot Specs */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  SESSION PARAMETERS:
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{formatBookingDate(date)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {startTime} → {endTime}
                </div>
              </div>

              {/* Select & Book Button */}
              {selectedSeat.status === 'available' ? (
                <button
                  onClick={openBookingModal}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={!labData?.isWithinHours}
                >
                  <Send size={16} />
                  <span>Book Seat {selectedSeat.seatIndex || (seats.findIndex((s) => s.seatId === selectedSeat.seatId) + 1)} ({selectedSeat.seatNumber})</span>
                </button>
              ) : (
                <button className="btn btn-secondary btn-lg" style={{ width: '100%' }} disabled>
                  Seat Unavailable
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
              <Monitor size={36} style={{ color: 'var(--text-subtle)', marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>Click any seat on the grid to inspect details and initiate reservation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Wizard Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={`Confirm Workstation Booking • Seat ${selectedSeat?.seatIndex || (seats.findIndex((s) => s?.seatId === selectedSeat?.seatId) + 1)} (${selectedSeat?.seatNumber})`}
        maxWidth="560px"
      >
        {bookingSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <CheckCircle size={48} style={{ color: '#059669', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Booking Request Submitted!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Your reservation request has been dispatched to your department faculty for verification. Redirecting to your bookings...
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking}>
            {bookingError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={18} />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Summary Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Laboratory:</span>
                <div style={{ fontWeight: '600' }}>{labData?.labName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Workstation:</span>
                <div style={{ fontWeight: '700', color: 'var(--primary)' }}>
                  Seat {selectedSeat?.seatIndex || (seats.findIndex((s) => s.seatId === selectedSeat?.seatId) + 1)}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {selectedSeat?.seatNumber}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date & Slot:</span>
                <div style={{ fontWeight: '600' }}>{formatBookingDate(date)}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{startTime} - {endTime}</div>
              </div>
            </div>

            {/* Faculty Selection */}
            <div className="form-group">
              <label className="form-label">Reviewing Faculty Member *</label>
              <select
                className="form-select"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                required
              >
                {faculties.length === 0 ? (
                  <option value="">No faculty members registered for {labData?.department || 'this department'}</option>
                ) : (
                  faculties.map((f) => (
                    <option key={f._id} value={f._id}>
                      Prof. {f.fullName} ({f.department} - {f.email})
                    </option>
                  ))
                )}
              </select>
              <p className="form-helper">
                Select which department faculty member will review and confirm your booking request.
              </p>
            </div>

            {/* Purpose */}
            <div className="form-group">
              <label className="form-label">Purpose of Lab Session *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. BCA Capstone Project coding, database query tuning, assignments..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            {/* Attendees */}
            <div className="form-group">
              <label className="form-label">Collaborating Attendees (comma-separated, optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Priya Sharma, David Miller"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>

            {/* Equipment */}
            <div className="form-group">
              <label className="form-label">Required Equipment / Accessories (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dual Monitor, CUDA GPU Workstation, VR Headset"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              />
            </div>

            {/* Special Request */}
            <div className="form-group">
              <label className="form-label">Special Requests (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Administrator terminal privileges, extended evening hours..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
              <p className="form-helper">
                Note: All student bookings are dispatched to your selected faculty member for verification.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="btn btn-secondary"
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={bookingLoading || faculties.length === 0}
              >
                {bookingLoading ? 'Submitting Reservation...' : 'Submit Booking Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
