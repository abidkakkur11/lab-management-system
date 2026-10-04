import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Building2, User } from 'lucide-react';
import { bookingService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { formatBookingDate } from '../../utils/dateUtils';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inspect modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      // Fetch bookings for a range around current month
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString().split('T')[0];

      const res = await bookingService.getCalendarBookings({ start, end });
      if (res.data?.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching calendar bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentDate]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group bookings by date string YYYY-MM-DD
  const bookingsMap = {};
  bookings.forEach((b) => {
    if (!bookingsMap[b.bookingDate]) bookingsMap[b.bookingDate] = [];
    bookingsMap[b.bookingDate].push(b);
  });

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>My Lab Schedule Calendar</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Personal visual overview of your scheduled lab sessions, reserved workstations, and timeslots.
          </p>
        </div>

        {/* View Mode & Nav Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('month')}
              className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
            >
              Week
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={prevMonth} className="btn btn-secondary btn-sm" title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', minWidth: '140px', textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="btn btn-secondary btn-sm" title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Rendering calendar schedule..." />
      ) : (
        <div className="card" style={{ padding: '20px' }}>
          {/* Day of Week Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: '700',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Calendar Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
            }}
          >
            {/* Blank offset boxes */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: viewMode === 'month' ? '90px' : '140px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '6px',
                  opacity: 0.5,
                }}
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayBookings = bookingsMap[dateStr] || [];
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={`day-${dayNum}`}
                  style={{
                    minHeight: viewMode === 'month' ? '96px' : '140px',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: isToday ? '#eff6ff' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isToday ? '800' : '600',
                        color: isToday ? 'var(--primary)' : 'var(--text-main)',
                      }}
                    >
                      {dayNum}
                    </span>
                    {dayBookings.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {/* Day Bookings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b._id}
                        onClick={() => setSelectedBooking(b)}
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor:
                            b.status === 'confirmed' ? '#dbeafe' : b.status === 'pending' ? '#fef3c7' : '#e2e8f0',
                          color:
                            b.status === 'confirmed' ? '#1e40af' : b.status === 'pending' ? '#92400e' : '#475569',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: '500',
                        }}
                        title={`${b.timeSlot?.startTime} - ${b.timeSlot?.endTime} • ${b.labId?.labName} (${b.seatNumber ? 'Seat ' + b.seatNumber : b.seatId})`}
                      >
                        {b.timeSlot?.startTime} • {b.seatNumber ? `Seat ${b.seatNumber}` : b.seatId}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        +{dayBookings.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={`My Session Details • ${selectedBooking?.bookingId}`}
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
              <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{selectedBooking.bookingId}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Laboratory:</span>
              <span style={{ fontWeight: '600' }}>{selectedBooking.labId?.labName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Workstation / Terminal:</span>
              <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                Seat {selectedBooking.seatNumber ? selectedBooking.seatNumber : selectedBooking.seatId} (Terminal ID: {selectedBooking.seatId})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Slot:</span>
              <span style={{ fontWeight: '600' }}>
                {formatBookingDate(selectedBooking.bookingDate)} ({selectedBooking.timeSlot?.startTime} - {selectedBooking.timeSlot?.endTime})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`badge badge-${selectedBooking.status}`}>{selectedBooking.status}</span>
            </div>

            {selectedBooking.facultyId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Verifying Faculty:</span>
                <span style={{ fontWeight: '600' }}>
                  Prof. {selectedBooking.facultyId?.userName || selectedBooking.facultyId?.fullName || 'Faculty Member'}
                </span>
              </div>
            )}

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Session Purpose:</span>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                {selectedBooking.purpose}
              </div>
            </div>

            {selectedBooking.specialRequests && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Special Requests:</span>
                <div style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '10px', borderRadius: '6px' }}>
                  {selectedBooking.specialRequests}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attendance Status:</span>
              <span style={{ fontWeight: '600' }}>
                {selectedBooking.checkInTime ? 'Checked In' : 'Not checked in yet'}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
