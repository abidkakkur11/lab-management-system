import React, { useState, useEffect } from 'react';
import { Calendar, Building2, Clock, Users, Search } from 'lucide-react';
import { facultyService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const FacultySchedulesPage = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [labId, setLabId] = useState('all');
  const [data, setData] = useState({ bookings: [], labs: [] });
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await facultyService.getSchedules({ date, labId });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [date, labId]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Laboratory Schedule Oversight</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Inspect detailed student terminal bookings and workstation occupancy for any date.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
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
            <select
              className="form-select"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
            >
              <option value="all">All Laboratories</option>
              {data.labs?.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.labName} ({l.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving schedule matrix..." />
      ) : data.bookings?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <Calendar size={36} style={{ color: 'var(--text-subtle)', marginBottom: '8px' }} />
          <h3>No bookings scheduled for this date</h3>
          <p style={{ fontSize: '0.85rem' }}>Selected laboratory is unoccupied on this day.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Terminal</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {b.timeSlot.startTime} - {b.timeSlot.endTime}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.timeSlot.duration} mins
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{b.seatId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.labId?.labName}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{b.userId?.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.userId?.email}
                    </div>
                  </td>
                  <td>{b.userId?.department}</td>
                  <td>
                    <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.purpose}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
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
