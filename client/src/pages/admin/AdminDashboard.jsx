import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Percent,
  PlusCircle,
  Shield,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { adminService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAnalytics();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading && !data) return <LoadingSpinner text="Loading system analytics..." />;

  const { summary, charts } = data || {};

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Administrator Control Center</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live aggregated metrics, laboratory utilization analytics, and user access oversight.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/labs" className="btn btn-primary">
            <Building2 size={16} />
            <span>Manage Laboratories</span>
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card">
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Users</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{summary?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {summary?.totalStudents || 0} Students • {summary?.totalFaculty || 0} Faculty
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '600' }}>Active Laboratories</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: 'var(--primary)' }}>
            {summary?.totalLabs || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across 3 campus blocks</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '600' }}>Today's Bookings</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: '#059669' }}>
            {summary?.todayBookings || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>Active sessions today</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '600' }}>Lab Utilization Rate</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: '#d97706' }}>
            {summary?.labUtilization || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workstation capacity load</div>
        </div>
      </div>

      {/* Real Recharts Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Chart 1: Bookings by Day */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Booking Trends (Recent Days)</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Daily workstation reservation volume across facilities
          </p>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.bookingsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Booking Status Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Booking Status Distribution</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Ratio of confirmed, completed, pending, and cancelled sessions
          </p>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.bookingsByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.bookingsByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Usage by Laboratory */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Most Utilized Laboratories</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Reservation counts by facility
          </p>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.bookingsByLab || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Department Usage */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Department Workstation Usage</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Activity distribution across academic branches
          </p>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.departmentUsage || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
