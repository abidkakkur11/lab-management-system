import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Briefcase,
  Camera,
  CheckCircle2,
  Save,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { userService, authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Password reset/change states
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });
  const [resetReqLoading, setResetReqLoading] = useState(false);
  const [resetReqMessage, setResetReqMessage] = useState({ text: '', type: '', resetUrl: '' });

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNumber: '',
    department: '',
    yearOfStudy: '',
    profession: '',
    skills: '',
    interests: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.userName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        department: user.department || 'Computer Science',
        yearOfStudy: user.yearOfStudy || '1st Year',
        profession: user.profession || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
        interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      const res = await userService.updateProfile(formData);
      if (res.data?.success) {
        updateUser(res.data.data);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      setAvatarLoading(true);
      const res = await userService.uploadAvatar(data);
      if (res.data?.success) {
        updateUser(res.data.data.user);
        setMessage({ text: 'Avatar uploaded successfully!', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to upload avatar.', type: 'error' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePwdChange = (e) => {
    setPwdData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMessage({ text: '', type: '' });

    if (!pwdData.currentPassword || !pwdData.newPassword || !pwdData.confirmPassword) {
      setPwdMessage({ text: 'All password fields are required.', type: 'error' });
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPwdMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdMessage({ text: 'New password and confirm password do not match.', type: 'error' });
      return;
    }

    try {
      setPwdLoading(true);
      const res = await authService.updatePassword({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });

      if (res.data?.success) {
        setPwdMessage({ text: 'Password updated successfully!', type: 'success' });
        setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPwdMessage({
        text: err.response?.data?.message || 'Failed to update password. Please verify your current password.',
        type: 'error',
      });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      setResetReqLoading(true);
      setResetReqMessage({ text: '', type: '', resetUrl: '' });
      const res = await authService.forgotPassword({ email: user.email });
      if (res.data?.success) {
        setResetReqMessage({
          text: 'Password reset link generated! You can use it to reset your password.',
          type: 'success',
          resetUrl: res.data?.data?.resetUrl || (res.data?.data?.resetToken ? `/reset-password/${res.data.data.resetToken}` : ''),
        });
      }
    } catch (err) {
      setResetReqMessage({
        text: err.response?.data?.message || 'Failed to request reset link.',
        type: 'error',
        resetUrl: '',
      });
    } finally {
      setResetReqLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Academic Profile & Settings</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Keep your skills and specialization up to date to get matched with the right peers and projects.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#065f46' : '#b91c1c',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Avatar & Header Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              overflow: 'hidden',
              border: '3px solid var(--border-light)',
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.userName?.charAt(0) || 'U'
            )}
          </div>

          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
            title="Upload new picture"
          >
            <Camera size={14} />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
            disabled={avatarLoading}
          />
        </div>

        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{user?.userName}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.email} • {user?.userId}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="badge badge-occupied" style={{ textTransform: 'capitalize' }}>
              {user?.userType} Portal Access
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="userName"
                className="form-input"
                value={formData.userName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                disabled
                style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }}
              />
              <span className="form-helper">Email cannot be modified directly.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academic Department</label>
              <input
                type="text"
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                disabled={user?.userType === 'faculty' || user?.userType === 'student'}
                style={
                  user?.userType === 'faculty' || user?.userType === 'student'
                    ? { backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }
                    : {}
                }
              />
              {(user?.userType === 'faculty' || user?.userType === 'student') && (
                <span className="form-helper">
                  Academic department is defined and managed by the College Administrator.
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <input
                type="text"
                name="yearOfStudy"
                className="form-input"
                value={formData.yearOfStudy}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Specialization / Role</label>
              <input
                type="text"
                name="profession"
                className="form-input"
                value={formData.profession}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '6px' }}>
            <label className="form-label">Technical Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              className="form-input"
              placeholder="e.g. React, Node.js, Express, MongoDB, Python, Docker"
              value={formData.skills}
              onChange={handleChange}
            />
            <span className="form-helper">Used by our peer matching algorithm to suggest partners.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Academic Research Interests (comma-separated)</label>
            <input
              type="text"
              name="interests"
              className="form-input"
              placeholder="e.g. Artificial Intelligence, Distributed Systems, Cloud Architecture"
              value={formData.interests}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Reset Card */}
      <div className="card" style={{ padding: '32px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Security & Password Reset</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Update your account password or generate an email reset link
            </p>
          </div>
        </div>

        {pwdMessage.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: pwdMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${pwdMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: pwdMessage.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {pwdMessage.type === 'success' && <CheckCircle2 size={16} />}
            <span>{pwdMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                }}
              />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="Enter current password"
                value={pwdData.currentPassword}
                onChange={handlePwdChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  placeholder="At least 6 characters"
                  value={pwdData.newPassword}
                  onChange={handlePwdChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Re-enter new password"
                  value={pwdData.confirmPassword}
                  onChange={handlePwdChange}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSendResetEmail}
              disabled={resetReqLoading}
            >
              <KeyRound size={15} />
              <span>{resetReqLoading ? 'Generating Link...' : 'Forgot Current Password? Send Reset Link'}</span>
            </button>

            <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
              <Save size={16} />
              <span>{pwdLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>

        {resetReqMessage.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '16px',
              backgroundColor: resetReqMessage.type === 'success' ? '#eff6ff' : '#fef2f2',
              border: `1px solid ${resetReqMessage.type === 'success' ? '#bfdbfe' : '#fecaca'}`,
              color: resetReqMessage.type === 'success' ? '#1e40af' : '#991b1b',
              fontSize: '0.85rem',
            }}
          >
            <div>{resetReqMessage.text}</div>
            {resetReqMessage.resetUrl && (
              <div style={{ marginTop: '8px' }}>
                <a
                  href={resetReqMessage.resetUrl}
                  style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  Click here to proceed to Password Reset Page &rarr;
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
