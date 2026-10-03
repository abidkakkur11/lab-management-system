import React, { useState, useEffect } from 'react';
import { Search, Users, Sparkles, FolderGit2, BookOpen, CheckCircle, Mail, Phone, ExternalLink } from 'lucide-react';
import { userService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const FindPeersPage = () => {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');

  // Selected Peer Profile Modal
  const [selectedPeer, setSelectedPeer] = useState(null);

  const fetchPeers = async () => {
    try {
      setLoading(true);
      const res = await userService.getPeers({ search, department });
      if (res.data?.success) {
        setPeers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching peers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeers();
  }, [department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPeers();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Peer Discovery & Matching</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Discover college peers with overlapping programming skills, shared academic interests, and active research projects.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Search by Name or Skill</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="e.g. React, Python, Priya..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Department Filter</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                Filter Peers
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Peers Grid */}
      {loading ? (
        <LoadingSpinner text="Computing skill compatibility metrics..." />
      ) : peers.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No peers found"
            message="No students matched your search criteria. Try removing filters or searching for specific technologies."
          />
        </div>
      ) : (
        <div className="labs-grid">
          {peers.map((peer) => (
            <div
              key={peer._id}
              className="card card-hover"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Header with Match Percentage Pill */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1rem',
                    }}
                  >
                    {peer.userName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{peer.userName}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {peer.department} • {peer.yearOfStudy}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: 'var(--primary)',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>{peer.matchScore}% Match</span>
                </div>
              </div>

              {/* Explainable Match Reason Banner */}
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.785rem',
                  color: '#065f46',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                <strong>Match Reason:</strong> {peer.matchExplanation}
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Skills:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                  {peer.skills?.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.725rem',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Academic Interests */}
              <div style={{ marginBottom: '18px', flex: 1 }}>
                <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Interests:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                  {peer.interests?.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.725rem',
                        backgroundColor: '#fff',
                        border: '1px solid var(--border-light)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer View Profile Button */}
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => setSelectedPeer(peer)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  View Peer Academic Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Peer Profile Modal */}
      <Modal
        isOpen={Boolean(selectedPeer)}
        onClose={() => setSelectedPeer(null)}
        title="Student Academic Profile"
      >
        {selectedPeer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '700',
                }}
              >
                {selectedPeer.userName?.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedPeer.userName}</h3>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {selectedPeer.department} • {selectedPeer.yearOfStudy}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                  {selectedPeer.profession || 'Student'}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                <span style={{ fontWeight: '500' }}>{selectedPeer.email}</span>
              </div>
              {selectedPeer.phoneNumber && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                  <span style={{ fontWeight: '500' }}>{selectedPeer.phoneNumber}</span>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Technical Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPeer.skills?.map((s, i) => (
                  <span key={i} className="badge badge-occupied" style={{ fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Academic Projects</h4>
              {selectedPeer.projects?.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No public projects listed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPeer.projects?.map((proj) => (
                    <div
                      key={proj._id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: '#fff',
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{proj.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {proj.category} • {proj.technologies?.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
