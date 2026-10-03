import React, { useState, useEffect } from 'react';
import { Handshake, Check, X, Undo2, MessageSquare, Send, Clock, User, CheckCircle2 } from 'lucide-react';
import { collaborationService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const CollaborationsPage = () => {
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Conversation modal
  const [activeThread, setActiveThread] = useState(null);
  const [chatMessage, setChatMessage] = useState('');

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const [incRes, outRes] = await Promise.all([
        collaborationService.getIncomingRequests(),
        collaborationService.getOutgoingRequests(),
      ]);
      if (incRes.data?.success) setIncoming(incRes.data.data);
      if (outRes.data?.success) setOutgoing(outRes.data.data);
    } catch (err) {
      console.error('Failed to load collaborations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const handleAccept = async (id) => {
    try {
      setActionLoading(true);
      const res = await collaborationService.acceptRequest(id);
      if (res.data?.success) {
        setMessage({ text: 'Collaboration accepted! Student has been added to your project team.', type: 'success' });
        fetchCollaborations();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Action failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      const res = await collaborationService.rejectRequest(id);
      if (res.data?.success) {
        setMessage({ text: 'Collaboration request rejected.', type: 'success' });
        fetchCollaborations();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Action failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    try {
      setActionLoading(true);
      const res = await collaborationService.withdrawRequest(id);
      if (res.data?.success) {
        setMessage({ text: 'Collaboration request withdrawn.', type: 'success' });
        fetchCollaborations();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Action failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeThread) return;

    try {
      const res = await collaborationService.addMessage(activeThread._id, { message: chatMessage });
      if (res.data?.success) {
        setActiveThread(res.data.data);
        setChatMessage('');
        fetchCollaborations();
      }
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const currentList = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Project Collaborations</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage requests to join student projects and build collaborative development teams.
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`btn ${activeTab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Incoming Requests</span>
          <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', background: activeTab === 'incoming' ? 'rgba(255,255,255,0.3)' : 'var(--bg-subtle)' }}>
            {incoming.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`btn ${activeTab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Sent Requests</span>
          <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', background: activeTab === 'outgoing' ? 'rgba(255,255,255,0.3)' : 'var(--bg-subtle)' }}>
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Retrieving collaboration requests..." />
      ) : currentList.length === 0 ? (
        <div className="card">
          <EmptyState
            title={`No ${activeTab} collaboration requests`}
            message={
              activeTab === 'incoming'
                ? 'When peers discover your academic projects and request to join, their proposals will appear here.'
                : "You haven't requested to join any peer projects yet. Explore Academic Projects to get involved!"
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentList.map((item) => (
            <div key={item._id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project:</span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '2px' }}>{item.projectId?.title}</h3>
                </div>
                <span className={`badge badge-${item.status}`}>{item.status}</span>
              </div>

              {/* Counterpart info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
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
                    fontSize: '0.8rem',
                    fontWeight: '700',
                  }}
                >
                  {(activeTab === 'incoming' ? item.requesterId?.userName : item.ownerId?.userName)?.charAt(0) || 'U'}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: '600' }}>
                    {activeTab === 'incoming' ? item.requesterId?.userName : item.ownerId?.userName}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                    Proposed Role: <strong>{item.proposedRole}</strong>
                  </span>
                </div>
              </div>

              {/* Message */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '14px' }}>
                {item.message}
              </div>

              {/* Skills */}
              {item.skills?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {item.skills.map((s, i) => (
                    <span key={i} className="badge badge-occupied" style={{ fontSize: '0.725rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <button
                  onClick={() => setActiveThread(item)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} />
                  <span>Discussion ({item.conversation?.length || 0})</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeTab === 'incoming' && item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(item._id)}
                        className="btn btn-secondary btn-sm"
                        disabled={actionLoading}
                      >
                        <X size={14} /> Decline
                      </button>
                      <button
                        onClick={() => handleAccept(item._id)}
                        className="btn btn-success btn-sm"
                        disabled={actionLoading}
                      >
                        <Check size={14} /> Accept & Add to Team
                      </button>
                    </>
                  )}

                  {activeTab === 'outgoing' && item.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(item._id)}
                      className="btn btn-danger btn-sm"
                      disabled={actionLoading}
                    >
                      <Undo2 size={14} /> Withdraw Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversation Thread Modal */}
      <Modal
        isOpen={Boolean(activeThread)}
        onClose={() => setActiveThread(null)}
        title="Collaboration Discussion Thread"
      >
        {activeThread && (
          <div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {activeThread.conversation?.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {new Date(msg.sentAt).toLocaleTimeString()}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a reply..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
