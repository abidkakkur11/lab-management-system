import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Handshake,
  CheckCircle,
  Clock,
  Sparkles,
  Trash2,
  UserPlus,
  X,
  AlertCircle,
} from 'lucide-react';
import { projectService, collaborationService, userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Collaboration Request Modal
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [proposedRole, setProposedRole] = useState('');
  const [collabMessage, setCollabMessage] = useState('');
  const [skillsOffered, setSkillsOffered] = useState('');
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabSuccess, setCollabSuccess] = useState(false);

  // Delete project
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Direct Add Collaborator (for Project Owner)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState('Project Collaborator');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectService.getProjectById(id);
      if (res.data?.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleSendCollaborationRequest = async (e) => {
    e.preventDefault();
    if (!proposedRole || !collabMessage) return;

    try {
      setCollabLoading(true);
      const res = await collaborationService.requestCollaboration({
        projectId: id,
        proposedRole,
        message: collabMessage,
        skills: skillsOffered ? skillsOffered.split(',').map((s) => s.trim()) : [],
      });
      if (res.data?.success) {
        setCollabSuccess(true);
        setTimeout(() => {
          setCollabModalOpen(false);
          fetchProject();
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send collaboration request.');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleteLoading(true);
      await projectService.deleteProject(id);
      navigate('/student/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddMemberModal = async () => {
    setAddMemberError('');
    setAddMemberModalOpen(true);
    setCandidateLoading(true);
    try {
      let candidates = [];
      const existingUserIds = (project.collaborators || []).map((c) => c.userId?._id?.toString() || c.userId?.toString());

      if (user.userType === 'faculty') {
        // Faculty can peer with both faculty and students
        const [studentRes, facultyRes] = await Promise.all([
          userService.getPeers({}),
          userService.getFaculties({}),
        ]);
        const students = studentRes.data?.data || [];
        const faculties = (facultyRes.data?.data || []).filter((f) => f._id !== user._id);
        candidates = [...students, ...faculties];
      } else {
        // Students can ONLY peer/collaborate with fellow students
        const res = await userService.getPeers({});
        candidates = res.data?.data || [];
      }

      // Filter out existing team members
      const filtered = candidates.filter((c) => !existingUserIds.includes(c._id.toString()));
      setCandidateUsers(filtered);
      if (filtered.length > 0) {
        setSelectedCandidateId(filtered[0]._id);
      }
    } catch (err) {
      console.error(err);
      setAddMemberError('Failed to fetch candidate collaborators.');
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      setAddMemberError('Please select a user to add as collaborator.');
      return;
    }

    try {
      setAddMemberLoading(true);
      setAddMemberError('');
      const res = await projectService.addCollaborator(id, {
        userId: selectedCandidateId,
        role: collaboratorRole,
      });

      if (res.data?.success) {
        setAddMemberModalOpen(false);
        fetchProject();
      }
    } catch (err) {
      setAddMemberError(err.response?.data?.message || 'Failed to add collaborator.');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveCollaborator = async (targetUserId) => {
    if (!window.confirm('Remove this collaborator from the project team?')) return;
    try {
      await projectService.removeCollaborator(id, targetUserId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove collaborator.');
    }
  };

  if (loading) return <LoadingSpinner text="Loading project details..." />;
  if (error || !project) return <div className="card" style={{ color: '#dc2626' }}>{error || 'Project not found.'}</div>;

  const isOwner = project.ownerId?._id === user?._id;
  const isCollaborator = project.collaborators?.some((c) => c.userId?._id === user?._id);
  const hasPendingRequest = project.myCollaboration?.status === 'pending';

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/student/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Main Details */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="badge badge-occupied" style={{ fontSize: '0.75rem' }}>
              {project.category}
            </span>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '16px' }}>{project.title}</h1>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Project Abstract & Overview</h4>
            <p style={{ fontSize: '0.925rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {project.description}
            </p>
          </div>

          {/* Tech Stack */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Technologies</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.technologies?.map((tech, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.tags.map((t, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements & Open Roles */}
          {project.requirements?.isLookingForCollaborators && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: '700', marginBottom: '8px' }}>
                <Sparkles size={18} />
                <span>Open for Peer Collaboration</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '6px' }}>
                <strong>Roles Needed:</strong> {project.requirements.rolesNeeded?.join(', ') || 'Developers'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
                <strong>Preferred Skills:</strong> {project.requirements.skillsNeeded?.join(', ') || 'Any'}
              </div>
            </div>
          )}

          {/* Collaborator Team List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Project Team Members</h4>
              {isOwner && (
                <button
                  type="button"
                  onClick={openAddMemberModal}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={14} />
                  <span>Add Collaborator</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {project.collaborators?.map((collab, i) => {
                const canRemove = isOwner && collab.userId?._id?.toString() !== project.ownerId?._id?.toString();
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                        }}
                      >
                        {collab.userId?.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                          {collab.userId?.userName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {collab.userId?.department} • <span style={{ textTransform: 'capitalize' }}>{collab.userId?.userType}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-occupied">{collab.role}</span>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collab.userId?._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 6px', color: '#ef4444' }}
                          title="Remove collaborator"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel: Actions & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Project Metadata</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Lead Architect:</span>
                <div style={{ fontWeight: '600' }}>{project.ownerId?.userName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.ownerId?.email}</div>
              </div>

              {project.repository?.url && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Source Code Repository:</span>
                  <div>
                    <a
                      href={project.repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                    >
                      {project.repository.platform || 'Repository'} <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>
                <div>{project.timeline?.startDate ? new Date(project.timeline.startDate).toLocaleDateString() : 'N/A'}</div>
              </div>

              {project.timeline?.expectedEndDate && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Completion:</span>
                  <div>{new Date(project.timeline.expectedEndDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              {!isOwner && !isCollaborator && (
                <div>
                  {hasPendingRequest ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      <Clock size={16} /> Request Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => setCollabModalOpen(true)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <Handshake size={16} /> Request Collaboration
                    </button>
                  )}
                </div>
              )}

              {isOwner && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%' }}
                >
                  <Trash2 size={14} /> Delete Project
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Request Modal */}
      <Modal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        title="Request to Join Academic Project"
      >
        {collabSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <CheckCircle size={40} style={{ color: '#059669', marginBottom: '8px' }} />
            <h4>Collaboration Request Sent!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              The project owner has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendCollaborationRequest}>
            <div className="form-group">
              <label className="form-label">Proposed Role *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Backend Developer, ML Engineer, UI Designer"
                value={proposedRole}
                onChange={(e) => setProposedRole(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message to Project Lead *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Explain why you want to join and what you will build..."
                value={collabMessage}
                onChange={(e) => setCollabMessage(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relevant Skills Offered (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Node.js, Express, MongoDB, Docker"
                value={skillsOffered}
                onChange={(e) => setSkillsOffered(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setCollabModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={collabLoading}>
                {collabLoading ? 'Sending...' : 'Send Collaboration Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Direct Collaborator Modal */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Add Project Collaborator"
        maxWidth="500px"
      >
        {addMemberError && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{addMemberError}</span>
          </div>
        )}

        {candidateLoading ? (
          <LoadingSpinner text="Loading eligible collaborators..." />
        ) : candidateUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
            <p>No available eligible collaborators found to add.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>
              {user.userType === 'student'
                ? 'Students can only collaborate with fellow students. All discovered peers may already be in this team.'
                : 'All registered students and faculty may already be members of this project.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleAddCollaborator}>
            <div className="form-group">
              <label className="form-label">
                Select {user.userType === 'faculty' ? 'Student or Faculty' : 'Student Peer'} *
              </label>
              <select
                className="form-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                required
              >
                {candidateUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.userType === 'faculty' ? 'Prof. ' : ''}{u.userName || u.fullName} ({u.department} • {u.userType})
                  </option>
                ))}
              </select>
              <p className="form-helper">
                {user.userType === 'faculty'
                  ? 'As faculty, you can directly add students and other faculty members to academic projects.'
                  : 'Students can collaborate with fellow department and campus students.'}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Project Role *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Lead Researcher, Frontend Developer, QA Engineer"
                value={collaboratorRole}
                onChange={(e) => setCollaboratorRole(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="btn btn-secondary"
                disabled={addMemberLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={addMemberLoading || candidateUsers.length === 0}
              >
                {addMemberLoading ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project?"
        message="Are you sure you want to permanently delete this project? This will remove all project documentation and pending collaboration requests."
        confirmText="Yes, Delete Project"
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};
