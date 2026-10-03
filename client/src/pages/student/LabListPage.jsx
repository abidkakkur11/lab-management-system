import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, MapPin, Users, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { labService, departmentService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const LabListPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await labService.getLabs({
        search,
        department,
        date: selectedDate,
        startTime,
        endTime,
      });
      if (res.data?.success) {
        setLabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch labs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [department, selectedDate, startTime, endTime]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getDepartments();
        if (res.data?.success) {
          setDepartmentsList(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load departments for filter', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLabs();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>College Laboratories</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Select a laboratory to inspect live graphical seat layout and reserve a computer terminal.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            {/* Search */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Labs</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Lab name or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departmentsList.length > 0 ? (
                  departmentsList.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                  </>
                )}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Time Slot */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>From</label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>To</label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Lab Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Calculating live workstation availability..." />
      ) : labs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Building2 size={40} style={{ color: 'var(--text-subtle)', marginBottom: '12px' }} />
          <h3>No laboratories matched your query</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            Try adjusting your search criteria or time window.
          </p>
        </div>
      ) : (
        <div className="labs-grid">
          {labs.map((lab) => (
            <div key={lab._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--primary)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {lab.department}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', marginTop: '2px' }}>{lab.labName}</h3>
                </div>
                <span className="badge badge-available">
                  <ShieldCheck size={12} /> Active
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '16px' }}>
                <MapPin size={15} />
                <span>{lab.location}</span>
              </div>

              {/* Real-time Status Breakdown */}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  textAlign: 'center',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#059669' }}>
                    {lab.stats?.available ?? 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Available</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#d97706' }}>
                    {lab.stats?.reserved ?? 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reserved</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#dc2626' }}>
                    {lab.stats?.occupied ?? 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Occupied</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lab.capacity}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Seats</div>
                </div>
              </div>

              {/* Facilities Pill Tags */}
              <div style={{ marginBottom: '20px', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  LAB FACILITIES:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {lab.facilities?.slice(0, 4).map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.725rem',
                        backgroundColor: '#fff',
                        border: '1px solid var(--border-light)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                  {lab.facilities?.length > 4 && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{lab.facilities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/student/labs/${lab._id}?date=${selectedDate}&start=${startTime}&end=${endTime}`}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto' }}
              >
                <span>View Graphical Seat Layout</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
