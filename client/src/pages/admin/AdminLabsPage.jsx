import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  Monitor,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService, labService, departmentService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminLabsPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Create Lab Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newLab, setNewLab] = useState({
    labName: '',
    department: '',
    location: '',
    capacity: 24,
    facilities: '',
  });

  // Edit Lab Details Modal
  const [editLabModalOpen, setEditLabModalOpen] = useState(false);
  const [editingLabData, setEditingLabData] = useState(null);

  // Seat Editor Modal
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [seats, setSeats] = useState([]);

  const [availableDepartments, setAvailableDepartments] = useState([]);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await labService.getLabs();
      if (res.data?.success) {
        setLabs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentService.getDepartments();
      if (res.data?.success && res.data.data.length > 0) {
        setAvailableDepartments(res.data.data);
        setNewLab((prev) => ({
          ...prev,
          department: res.data.data[0].name,
        }));
      }
    } catch (err) {
      console.error('Error fetching departments for lab creation:', err);
    }
  };

  useEffect(() => {
    fetchLabs();
    fetchDepartments();
  }, []);

  const resetNewLab = () => {
    setNewLab({
      labName: '',
      department: availableDepartments[0]?.name || 'Computer Science',
      location: '',
      capacity: 24,
      facilities: '',
    });
  };

  const handleOpenCreateModal = () => {
    resetNewLab();
    setCreateModalOpen(true);
  };

  const handleCreateLab = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await adminService.createLab({
        ...newLab,
        facilities: newLab.facilities.split(',').map((s) => s.trim()).filter(Boolean),
      });
      if (res.data?.success) {
        setMsg('Laboratory created successfully.');
        setCreateModalOpen(false);
        resetNewLab();
        fetchLabs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create laboratory.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditLabModal = (lab) => {
    setEditingLabData({
      _id: lab._id,
      labId: lab.labId,
      labName: lab.labName,
      department: lab.department,
      location: lab.location,
      facilities: Array.isArray(lab.facilities) ? lab.facilities.join(', ') : (lab.facilities || ''),
      isActive: lab.isActive !== false,
    });
    setEditLabModalOpen(true);
  };

  const handleUpdateLab = async (e) => {
    e.preventDefault();
    if (!editingLabData) return;
    try {
      setActionLoading(true);
      const res = await adminService.updateLab(editingLabData._id, {
        labName: editingLabData.labName,
        department: editingLabData.department,
        location: editingLabData.location,
        facilities: editingLabData.facilities.split(',').map((s) => s.trim()).filter(Boolean),
        isActive: editingLabData.isActive,
      });
      if (res.data?.success) {
        setMsg(`Laboratory "${editingLabData.labName}" updated successfully.`);
        setEditLabModalOpen(false);
        setEditingLabData(null);
        fetchLabs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update laboratory.');
    } finally {
      setActionLoading(false);
    }
  };

  const openSeatEditor = (lab) => {
    setEditingLab(lab);
    setSeats([...(lab.layout?.seats || [])]);
    setSeatModalOpen(true);
  };

  const handleAddSeat = () => {
    const nextIdx = seats.length + 1;
    const width = editingLab?.layout?.width || 6;
    const row = Math.floor(seats.length / width);
    const col = seats.length % width;

    setSeats([
      ...seats,
      {
        seatId: `S-${nextIdx}`,
        seatNumber: `PC-${String(nextIdx).padStart(2, '0')}`,
        xCoordinate: col,
        yCoordinate: row,
        isWorking: true,
      },
    ]);
  };

  const handleRemoveSeat = (index) => {
    setSeats(seats.filter((_, idx) => idx !== index));
  };

  const handleToggleWorking = (index) => {
    const updated = [...seats];
    updated[index].isWorking = !updated[index].isWorking;
    setSeats(updated);
  };

  const handleSeatNumberChange = (index, val) => {
    const updated = [...seats];
    updated[index].seatNumber = val;
    setSeats(updated);
  };

  const handleSaveSeats = async () => {
    try {
      setActionLoading(true);
      const res = await adminService.updateLabSeats(editingLab._id, {
        seats,
        width: editingLab?.layout?.width || 6,
      });
      if (res.data?.success) {
        setMsg('Seat configuration and capacity saved successfully.');
        setSeatModalOpen(false);
        fetchLabs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save seats.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this laboratory? It will hide it from student booking.')) return;
    try {
      await adminService.deleteLab(id);
      fetchLabs();
    } catch (err) {
      alert('Failed to deactivate.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Laboratory & Terminal Management</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure college computer labs, workstation numbers, hardware availability, and operating hours.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Create Laboratory</span>
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading laboratory configurations..." />
      ) : (
        <div className="labs-grid">
          {labs.map((lab) => (
            <div key={lab._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>
                    {lab.department}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{lab.labName}</h3>
                </div>
                <span className={`badge ${lab.isActive ? 'badge-available' : 'badge-cancelled'}`}>
                  {lab.isActive ? 'Operational' : 'Deactivated'}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {lab.location}
              </div>

              {/* Stats Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{lab.capacity}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Configured Seats</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#059669' }}>
                    {lab.layout?.seats?.filter((s) => s.isWorking)?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operational</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#dc2626' }}>
                    {lab.layout?.seats?.filter((s) => !s.isWorking)?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Out of Order</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => openEditLabModal(lab)}
                  className="btn btn-secondary btn-sm"
                  title="Edit Laboratory Details"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Edit size={14} />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => openSeatEditor(lab)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  title="Configure Workstations & Seats"
                >
                  <Monitor size={14} />
                  <span>Seats</span>
                </button>

                <button
                  onClick={() => handleDeactivate(lab._id)}
                  className={`btn btn-sm ${lab.isActive ? 'btn-danger' : 'btn-success'}`}
                  title={lab.isActive ? 'Deactivate Laboratory' : 'Activate Laboratory'}
                >
                  {lab.isActive ? <Trash2 size={14} /> : <CheckCircle size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual Seat Editor Modal */}
      <Modal
        isOpen={seatModalOpen}
        onClose={() => setSeatModalOpen(false)}
        title={`Workstation & Seat Editor • ${editingLab?.labName}`}
        maxWidth="720px"
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current Capacity: <strong>{seats.length} Workstations</strong> ({seats.filter((s) => s.isWorking).length} Operational)
            </div>
            <button onClick={handleAddSeat} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Terminal</span>
            </button>
          </div>

          {/* Seat Grid List */}
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px',
              padding: '10px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            {seats.map((seat, index) => (
              <div
                key={index}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: seat.isWorking ? '#fff' : '#fee2e2',
                  border: seat.isWorking ? '1px solid var(--border-light)' : '1px solid #fecaca',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSeat(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}
                    title="Delete Seat"
                  >
                    ×
                  </button>
                </div>

                <input
                  type="text"
                  value={seat.seatNumber}
                  onChange={(e) => handleSeatNumberChange(index, e.target.value)}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)',
                    width: '100%',
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleToggleWorking(index)}
                  className={`btn btn-sm ${seat.isWorking ? 'btn-success' : 'btn-danger'}`}
                  style={{ fontSize: '0.675rem', padding: '3px 6px' }}
                >
                  {seat.isWorking ? 'Operational' : 'Out of Order'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setSeatModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveSeats} className="btn btn-primary" disabled={actionLoading}>
              <Save size={16} />
              <span>{actionLoading ? 'Saving Layout...' : 'Save Workstation Layout'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Lab Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Laboratory Facility"
      >
        <form onSubmit={handleCreateLab}>
          <div className="form-group">
            <label className="form-label">Laboratory Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Computer Science Lab C"
              value={newLab.labName}
              onChange={(e) => setNewLab({ ...newLab, labName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Department *</label>
                <Link to="/admin/departments" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                  + Manage Depts
                </Link>
              </div>
              {availableDepartments.length > 0 ? (
                <select
                  className="form-select"
                  value={newLab.department}
                  onChange={(e) => setNewLab({ ...newLab, department: e.target.value })}
                  required
                >
                  {availableDepartments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science or BCA"
                  value={newLab.department}
                  onChange={(e) => setNewLab({ ...newLab, department: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Initial Terminal Capacity</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-input"
                value={newLab.capacity}
                onChange={(e) => setNewLab({ ...newLab, capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Campus Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Science Block • Floor 3, Room 302"
              value={newLab.location}
              onChange={(e) => setNewLab({ ...newLab, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Facilities (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dual Monitors, Air Conditioned, High-Speed LAN"
              value={newLab.facilities}
              onChange={(e) => setNewLab({ ...newLab, facilities: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Facility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Laboratory Details Modal */}
      {editingLabData && (
        <Modal
          isOpen={editLabModalOpen}
          onClose={() => setEditLabModalOpen(false)}
          title={`Edit Facility • ${editingLabData.labName}`}
        >
          <form onSubmit={handleUpdateLab}>
            <div className="form-group">
              <label className="form-label">Laboratory Name *</label>
              <input
                type="text"
                className="form-input"
                value={editingLabData.labName}
                onChange={(e) => setEditingLabData({ ...editingLabData, labName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Department *</label>
                  <Link to="/admin/departments" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                    + Manage Depts
                  </Link>
                </div>
                {availableDepartments.length > 0 ? (
                  <select
                    className="form-select"
                    value={editingLabData.department}
                    onChange={(e) => setEditingLabData({ ...editingLabData, department: e.target.value })}
                    required
                  >
                    {availableDepartments.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={editingLabData.department}
                    onChange={(e) => setEditingLabData({ ...editingLabData, department: e.target.value })}
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Operating Status</label>
                <select
                  className="form-select"
                  value={editingLabData.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingLabData({ ...editingLabData, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Active & Operational</option>
                  <option value="false">Deactivated / Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Science Block • Floor 3, Room 302"
                value={editingLabData.location}
                onChange={(e) => setEditingLabData({ ...editingLabData, location: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Facilities (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dual Monitors, Air Conditioned, High-Speed LAN"
                value={editingLabData.facilities}
                onChange={(e) => setEditingLabData({ ...editingLabData, facilities: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setEditLabModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
