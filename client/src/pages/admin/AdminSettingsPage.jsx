import React, { useState } from 'react';
import { Settings, Shield, Database, Server, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminSettingsPage = () => {
  const [sessionTimeout, setSessionTimeout] = useState('24');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('14');
  const [autoApprove, setAutoApprove] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>System Parameters & Laboratory Policies</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Configure system-wide booking rules, session durations, and server diagnostics.
        </p>
      </div>

      {saved && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
          Policies updated successfully.
        </div>
      )}

      {/* Booking Rules Form */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Reservation Policies</h3>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">JWT Token Expiry (Hours)</label>
              <input
                type="number"
                className="form-input"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Advance Booking Window (Days)</label>
              <input
                type="number"
                className="form-input"
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="autoApprove" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Auto-confirm standard student workstation bookings without special requests
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Update Laboratory Policy
          </button>
        </form>
      </div>

      {/* Diagnostics Card */}
      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Architecture & Server Telemetry</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Backend Architecture:</span>
            <span style={{ fontWeight: '600' }}>Node.js + Express.js REST API</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Database Layer:</span>
            <span style={{ fontWeight: '600' }}>MongoDB / Mongoose ODM</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Real-time Protocols:</span>
            <span style={{ fontWeight: '600' }}>Socket.IO WebSocket Gateway</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Security Hardening:</span>
            <span style={{ fontWeight: '600' }}>JWT Verification, Helmet, bcryptjs Hashing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
