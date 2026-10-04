import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Shield, CheckCircle, XCircle, Edit, Save, Trash2, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService, departmentService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { StudentDetailsModal } from '../../components/common/StudentDetailsModal';

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [departmentsList, setDepartmentsList] = useState([]);

  // Delete User Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    userName: '',
    email: '',
    password: '',
    userType: 'student',
    department: 'Computer Science',
    profession: 'Student',
    phoneNumber: '',
  });

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Password visibility & View details modal
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedStudentToView, setSelectedStudentToView] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        search,
        role,
        department,
        status,
      });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role, department, status]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getDepartments();
        if (res.data?.success) {
          setDepartmentsList(res.data.data);
          if (res.data.data.length > 0) {
            setNewUser((prev) => ({ ...prev, department: res.data.data[0].name }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments in users page:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userObj) => {
    if (currentUser && (userObj._id === currentUser._id || userObj.userId === currentUser.userId)) {
      alert('Security violation: You cannot deactivate your own active administrator account.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.toggleUserStatus(userObj._id);
      if (res.data?.success) {
        setMsg(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (currentUser && (userToDelete._id === currentUser._id || userToDelete.userId === currentUser.userId)) {
      alert('Security violation: You cannot delete your own administrator account.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.deleteUser(userToDelete._id);
      if (res.data?.success) {
        setMsg(res.data.message);
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await adminService.createUser(newUser);
      if (res.data?.success) {
        setMsg('User created successfully.');
        setCreateModalOpen(false);
        setNewUser({
          userName: '',
          email: '',
          password: '',
          userType: 'student',
          department: 'Computer Science',
          profession: 'Student',
          phoneNumber: '',
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const isSelf = currentUser && (editingUser._id === currentUser._id || editingUser.userId === currentUser.userId);
    if (isSelf && editingUser.userType !== 'admin') {
      alert('Security violation: You cannot revoke your own administrator privileges.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.updateUser(editingUser._id, editingUser);
      if (res.data?.success) {
        setMsg('User updated successfully.');
        setEditModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>User Access Management</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inspect campus credentials, grant administrative privileges, and activate or deactivate accounts.
          </p>
        </div>

        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
          {msg}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Users</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Name, email, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Department</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="All">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Deactivated</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving campus user directory..." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>User ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser && (u._id === currentUser._id || u.userId === currentUser.userId || u.email === currentUser.email);
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600' }}>{u.userName}</span>
                        {isSelf && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              fontSize: '0.675rem',
                              fontWeight: '700',
                            }}
                          >
                            Current Session (You)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{u.userId}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            u.userType === 'admin' ? '#fef3c7' : u.userType === 'faculty' ? '#f3e8ff' : '#eff6ff',
                          color:
                            u.userType === 'admin' ? '#92400e' : u.userType === 'faculty' ? '#6b21a8' : '#1e40af',
                        }}
                      >
                        {u.userType}
                      </span>
                    </td>
                    <td>{u.department}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-available' : 'badge-cancelled'}`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentToView(u)}
                          className="btn btn-secondary btn-sm"
                          title="View full user details"
                        >
                          <Eye size={14} />
                        </button>

                        {u.userType !== 'student' && (
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                        )}

                        {isSelf ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled
                            style={{ opacity: 0.65, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Protected: Current administrator account cannot be deactivated or deleted"
                          >
                            <Lock size={12} />
                            <span>Protected</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                              disabled={actionLoading}
                              title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                              <span>{u.isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteModalOpen(true);
                              }}
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading}
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setShowNewPassword(false);
        }}
        title="Add Campus User Account"
        closeOnBackdrop={false}
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={newUser.userName}
              onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={newUser.userType}
                onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              {departmentsList.length > 0 ? (
                <select
                  className="form-select"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                >
                  {departmentsList.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '40px' }}
                placeholder="Enter initial password (min. 6 characters)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User • ${editingUser?.userName}`}
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={editingUser.userName}
                onChange={(e) => setEditingUser({ ...editingUser, userName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={editingUser.userType}
                  onChange={(e) => setEditingUser({ ...editingUser, userType: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                {departmentsList.length > 0 ? (
                  <select
                    className="form-select"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  >
                    {departmentsList.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={editingUser.phoneNumber || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete User Account"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#dc2626' }}>
              <AlertTriangle size={28} />
              <div>
                <strong>Are you sure you want to permanently delete this user?</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {userToDelete.userName} ({userToDelete.email}) • Role: {userToDelete.userType}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              This action will remove the user account from the system directory. This operation cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="btn btn-danger" disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Full Student Profile Details Modal */}
      <StudentDetailsModal
        isOpen={Boolean(selectedStudentToView)}
        onClose={() => setSelectedStudentToView(null)}
        student={selectedStudentToView}
      />
    </div>
  );
};
