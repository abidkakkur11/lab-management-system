import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  PlusCircle,
  Search,
  Building,
  Users,
  Monitor,
  Edit,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { departmentService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headOfDepartment: '',
    building: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Delete Confirm Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getDepartments({ all: 'true', search });
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to retrieve departments list.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDepartments();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await departmentService.createDepartment(formData);
      if (res.data?.success) {
        setMsg({ text: `Department "${formData.name}" created successfully.`, type: 'success' });
        setCreateModalOpen(false);
        setFormData({
          name: '',
          code: '',
          headOfDepartment: '',
          building: '',
          contactEmail: '',
          contactPhone: '',
          description: '',
        });
        fetchDepartments();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create department.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditOpen = (dept) => {
    setEditingDept({
      _id: dept._id,
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment || '',
      building: dept.building || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      description: dept.description || '',
      isActive: dept.isActive,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await departmentService.updateDepartment(editingDept._id, editingDept);
      if (res.data?.success) {
        setMsg({ text: `Department "${editingDept.name}" updated successfully.`, type: 'success' });
        setEditModalOpen(false);
        fetchDepartments();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update department.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return;
    try {
      setActionLoading(true);
      const res = await departmentService.deleteDepartment(deptToDelete._id);
      if (res.data?.success) {
        setMsg({ text: res.data.message || 'Department removed successfully.', type: 'success' });
        setDeleteModalOpen(false);
        setDeptToDelete(null);
        fetchDepartments();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Could not delete department.', type: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalDepts = departments.length;
  const totalLabsAssigned = departments.reduce((acc, d) => acc + (d.stats?.labs || 0), 0);
  const totalUsersAssigned = departments.reduce((acc, d) => acc + (d.stats?.users || 0), 0);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap style={{ color: 'var(--primary)' }} />
            Academic Department Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
            Configure and manage college academic departments, faculty leads, and associated laboratories.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusCircle size={18} />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Alert banner */}
      {msg.text && (
        <div
          className={`badge ${msg.type === 'success' ? 'badge-available' : 'badge-cancelled'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        >
          <span>{msg.text}</span>
          <button
            onClick={() => setMsg({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Departments
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{totalDepts}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Monitor size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Connected Labs
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{totalLabsAssigned}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Enrolled Users
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{totalUsersAssigned}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search department by name, code or HOD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Departments Table / Cards */}
      {loading ? (
        <LoadingSpinner text="Loading academic departments..." />
      ) : departments.length === 0 ? (
        <div className="card empty-state">
          <GraduationCap className="empty-state-icon" style={{ margin: '0 auto 16px' }} />
          <h3>No Departments Configured</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '8px auto 20px' }}>
            You have not registered any academic departments yet. Add departments like Computer Science, BCA, or Data Science so they can be selected when creating laboratories and users.
          </p>
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create First Department</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Department Name & Code</th>
                <th>Head of Department (HOD)</th>
                <th>Location / Facility</th>
                <th>Contact</th>
                <th>Assigned Labs</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{dept.name}</span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                        }}
                      >
                        {dept.code}
                      </span>
                    </div>
                    {dept.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px' }}>
                        {dept.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {dept.headOfDepartment ? (
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{dept.headOfDepartment}</div>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {dept.building ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Building size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{dept.building}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Not specified</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                      {dept.contactEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Mail size={12} />
                          <span>{dept.contactEmail}</span>
                        </div>
                      )}
                      {dept.contactPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Phone size={12} />
                          <span>{dept.contactPhone}</span>
                        </div>
                      )}
                      {!dept.contactEmail && !dept.contactPhone && (
                        <span style={{ color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: (dept.stats?.labs || 0) > 0 ? '#eff6ff' : '#f1f5f9',
                        color: (dept.stats?.labs || 0) > 0 ? '#1e40af' : '#64748b',
                        fontWeight: '700',
                      }}
                    >
                      {dept.stats?.labs || 0} Labs
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${dept.isActive ? 'badge-available' : 'badge-cancelled'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => handleEditOpen(dept)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Department"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setDeptToDelete(dept);
                          setDeleteModalOpen(true);
                        }}
                        className="btn btn-danger btn-sm"
                        title="Delete Department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Academic Department"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Applications (BCA)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BCA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Head of Department (HOD)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Robert Vance"
                value={formData.headOfDepartment}
                onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Building / Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Science Block, Floor 2"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="dept@college.edu"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1-555-0123"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Specialization</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Undergraduate computer applications, database systems, software engineering."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      {editingDept && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Department: ${editingDept.name}`}
        >
          <form onSubmit={handleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Head of Department (HOD)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDept.headOfDepartment}
                  onChange={(e) => setEditingDept({ ...editingDept, headOfDepartment: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Building / Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDept.building}
                  onChange={(e) => setEditingDept({ ...editingDept, building: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editingDept.contactEmail}
                  onChange={(e) => setEditingDept({ ...editingDept, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDept.contactPhone}
                  onChange={(e) => setEditingDept({ ...editingDept, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editingDept.description}
                onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="editIsActive"
                checked={editingDept.isActive}
                onChange={(e) => setEditingDept({ ...editingDept, isActive: e.target.checked })}
              />
              <label htmlFor="editIsActive" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                Department is Active (visible in creation and filter dropdowns)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete Department"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#dc2626' }}>
              <AlertTriangle size={28} />
              <div>
                <strong>Are you sure you want to delete this department?</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {deptToDelete.name} ({deptToDelete.code})
                </div>
              </div>
            </div>

            {(deptToDelete.stats?.labs || 0) > 0 && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                }}
              >
                <strong>Warning:</strong> This department has {deptToDelete.stats?.labs} laboratory/laboratories assigned. You must reassign or remove those labs before this department can be deleted.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={actionLoading || (deptToDelete.stats?.labs || 0) > 0}
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
