import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/api';

export const AdminNotificationsPage = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setLoading(true);
      setSuccessMsg('');
      const res = await adminService.broadcastNotification({
        title,
        message,
        priority,
        target,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setTitle('');
        setMessage('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Broadcast Campus Announcement</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Issue high-priority announcements and maintenance alerts to connected students and faculty.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleBroadcast}>
          <div className="form-group">
            <label className="form-label">Announcement Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Scheduled Network Upgrade & Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Details *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Type your announcement content here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="all">All Campus Users</option>
                <option value="students">Students Only</option>
                <option value="faculty">Faculty Members Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low (Information)</option>
                <option value="medium">Medium (Standard Notice)</option>
                <option value="high">High (Urgent / Maintenance)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              <Send size={16} />
              <span>{loading ? 'Dispatching Broadcast...' : 'Broadcast to Selected Users'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
