import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderGit2, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { projectService } from '../../services/api';

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    technologies: '',
    tags: '',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    repositoryUrl: '',
    repositoryPlatform: 'GitHub',
    skillsNeeded: '',
    rolesNeeded: '',
    isLookingForCollaborators: true,
    visibility: 'public',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide a title and detailed description for your project.');
      return;
    }

    try {
      setLoading(true);
      const res = await projectService.createProject(formData);
      if (res.data?.success) {
        navigate(`/student/projects/${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/student/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800', marginTop: '8px' }}>Create Academic Project</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Publish your college lab capstone or research initiative to collaborate with peers.
        </p>
      </div>

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
          {/* Project Title */}
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. LabPulse - Smart Laboratory Allocation System"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Abstract / Project Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              rows={4}
              placeholder="Describe the problem, architecture, methodology, and objectives..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Web Development">Web Development</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="IoT & Embedded">IoT & Embedded</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Mobile Applications">Mobile Applications</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Development Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="planning">Planning Phase</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            {/* Expected End Date */}
            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                name="expectedEndDate"
                className="form-input"
                value={formData.expectedEndDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Technologies */}
          <div className="form-group">
            <label className="form-label">Technologies & Frameworks (comma-separated)</label>
            <input
              type="text"
              name="technologies"
              className="form-input"
              placeholder="e.g. React, Node.js, Express, MongoDB, Socket.IO, Docker"
              value={formData.technologies}
              onChange={handleChange}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags / Keywords (comma-separated)</label>
            <input
              type="text"
              name="tags"
              className="form-input"
              placeholder="e.g. FullStack, MERN, Laboratory, Capstone"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>

          {/* Collaboration Section */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="isLookingForCollaborators"
                name="isLookingForCollaborators"
                checked={formData.isLookingForCollaborators}
                onChange={handleChange}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="isLookingForCollaborators" style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                Open for Peer Collaborators
              </label>
            </div>

            {formData.isLookingForCollaborators && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Skills Needed</label>
                  <input
                    type="text"
                    name="skillsNeeded"
                    className="form-input"
                    placeholder="e.g. MongoDB, Docker, Testing"
                    value={formData.skillsNeeded}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Roles Needed</label>
                  <input
                    type="text"
                    name="rolesNeeded"
                    className="form-input"
                    placeholder="e.g. Backend Developer, UI Designer"
                    value={formData.rolesNeeded}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Repository Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Repository URL (optional)</label>
              <input
                type="url"
                name="repositoryUrl"
                className="form-input"
                placeholder="https://github.com/username/project"
                value={formData.repositoryUrl}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Platform</label>
              <select
                name="repositoryPlatform"
                className="form-select"
                value={formData.repositoryPlatform}
                onChange={handleChange}
              >
                <option value="GitHub">GitHub</option>
                <option value="GitLab">GitLab</option>
                <option value="Bitbucket">Bitbucket</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => navigate('/student/projects')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Creating Project...' : 'Publish Academic Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
