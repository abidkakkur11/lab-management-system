import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Building2, CheckCircle, Clock } from 'lucide-react';
import { facultyService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const FacultyReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await facultyService.getReports();
        if (res.data?.success) {
          setReport(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const exportCSV = () => {
    if (!report?.labStats) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Lab ID,Lab Name,Department,Capacity,Total Bookings,Completed Sessions\n';

    report.labStats.forEach((row) => {
      csvContent += `${row.labId},"${row.labName}","${row.department}",${row.capacity},${row.totalBookings},${row.completedBookings}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lab_usage_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner text="Generating usage analytics..." />;

  const { summary, labStats = [] } = report || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Laboratory Usage Reports</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Audited aggregate statistics of college workstation reservations and facility throughput.
          </p>
        </div>

        <button onClick={exportCSV} className="btn btn-primary">
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cumulative Bookings</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>{summary?.totalBookings || 0}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confirmed Reservations</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#2563eb' }}>{summary?.confirmedCount || 0}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed Sessions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#059669' }}>{summary?.completedCount || 0}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cancelled Bookings</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#dc2626' }}>{summary?.cancelledCount || 0}</div>
        </div>
      </div>

      {/* Lab Breakdown Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Laboratory Utilization Breakdown</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Lab ID</th>
                <th>Laboratory Name</th>
                <th>Department</th>
                <th>Total Workstations</th>
                <th>Total Bookings</th>
                <th>Completed Sessions</th>
              </tr>
            </thead>
            <tbody>
              {labStats.map((l) => (
                <tr key={l.labId}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{l.labId}</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{l.labName}</td>
                  <td>{l.department}</td>
                  <td>{l.capacity} Seats</td>
                  <td>
                    <span style={{ fontWeight: '700' }}>{l.totalBookings}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#059669' }}>{l.completedBookings}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
