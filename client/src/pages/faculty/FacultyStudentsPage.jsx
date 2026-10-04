import React, { useState, useEffect } from 'react';
import { Users, Search, BookOpen, CheckCircle, Clock, Eye } from 'lucide-react';
import { facultyService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StudentDetailsModal } from '../../components/common/StudentDetailsModal';

export const FacultyStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [selectedStudentToView, setSelectedStudentToView] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await facultyService.getStudents({ search, department });
      if (res.data?.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Student Laboratory Activity</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Monitor enrolled students, tracking workstation reservations and completed sessions.
        </p>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Student</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                Filter Students
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling student activity metrics..." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Department & Year</th>
                <th>Total Bookings</th>
                <th>Completed Sessions</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{s.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{s.userId}</span>
                  </td>
                  <td>
                    <div>{s.department}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.yearOfStudy}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700' }}>{s.stats?.totalBookings || 0}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#059669' }}>
                      {s.stats?.completedBookings || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-available' : 'badge-cancelled'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentToView(s)}
                      className="btn btn-secondary btn-sm"
                      title="View full student credentials"
                    >
                      <Eye size={14} /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={Boolean(selectedStudentToView)}
        onClose={() => setSelectedStudentToView(null)}
        student={selectedStudentToView}
      />
    </div>
  );
};
