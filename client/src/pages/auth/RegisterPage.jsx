import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Phone, BookOpen, Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { departmentService } from '../../services/api';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    department: 'Computer Science',
    yearOfStudy: '1st Year',
    profession: 'Student',
    skills: '',
    interests: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [regMessage, setRegMessage] = useState('');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getDepartments();
        if (res.data?.success && res.data.data.length > 0) {
          setDepartmentsList(res.data.data);
          setFormData((prev) => ({
            ...prev,
            department: prev.department || res.data.data[0].name,
          }));
        }
      } catch (err) {
        console.error('Could not fetch departments for register:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        yearOfStudy: formData.yearOfStudy,
        profession: formData.profession,
        skills: formData.skills,
        interests: formData.interests,
      });

      if (res?.requiresApproval) {
        setRegMessage(
          res.message ||
            'Registration submitted successfully! Your account is pending verification and approval by your department faculty.'
        );
        setRegisteredSuccess(true);
        return;
      }

      if (res?.user?.userType === 'admin') {
        navigate('/admin/dashboard');
      } else if (res?.user?.userType === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '36px 16px',
      }}
    >
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'var(--primary)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.4rem',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            L
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Create Student Account</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Register to book college lab workstations, build projects, and discover peers
          </p>
        </div>

        {registeredSuccess ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
              Registration Submitted!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              {regMessage}
            </p>
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.85rem',
                color: '#1e40af',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <strong>What happens next?</strong>
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>Your department faculty will review and verify your student credentials.</li>
                <li>Once approved, you will have full access to your department laboratories and workstations.</li>
              </ul>
            </div>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Proceed to Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type="text"
                    name="userName"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. Alex Johnson"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">College Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="+1 555-0199"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  {departmentsList.length > 0 ? (
                    departmentsList.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                    </>
                  )}
                </select>
              </div>

              {/* Year of Study */}
              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <select
                  name="yearOfStudy"
                  className="form-select"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                >
                  <option value="1st Year">1st Year (Undergraduate)</option>
                  <option value="2nd Year">2nd Year (Undergraduate)</option>
                  <option value="3rd Year">3rd Year (Undergraduate)</option>
                  <option value="4th Year">4th Year (Undergraduate)</option>
                  <option value="Postgraduate">Postgraduate (Masters / Research)</option>
                </select>
              </div>

              {/* Profession */}
              <div className="form-group">
                <label className="form-label">Specialization / Profession</label>
                <input
                  type="text"
                  name="profession"
                  className="form-input"
                  placeholder="e.g. Student & Web Developer"
                  value={formData.profession}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="form-group" style={{ marginTop: '4px' }}>
              <label className="form-label">Technical Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                className="form-input"
                placeholder="e.g. React, JavaScript, Node.js, Python, MongoDB"
                value={formData.skills}
                onChange={handleChange}
              />
              <p className="form-helper">Used to intelligently match you with academic projects and peer collaborators.</p>
            </div>

            {/* Interests */}
            <div className="form-group">
              <label className="form-label">Academic Interests (comma-separated)</label>
              <input
                type="text"
                name="interests"
                className="form-input"
                placeholder="e.g. Web Development, Deep Learning, Cloud Computing, IoT"
                value={formData.interests}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? 'Registering Account...' : 'Complete Registration'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary)' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
