import React from 'react';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ShieldCheck,
  Briefcase,
  Sparkles,
  Tag,
  GraduationCap,
} from 'lucide-react';
import { Modal } from './Modal';
import { formatBookingDate } from '../../utils/dateUtils';

export const StudentDetailsModal = ({ isOpen, onClose, student }) => {
  if (!student) return null;

  const isApproved = student.approvalStatus === 'approved';
  const isPending = student.approvalStatus === 'pending';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Profile & Academic Credentials"
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800',
              flexShrink: 0,
            }}
          >
            {student.userName?.charAt(0) || 'S'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                {student.userName}
              </h2>
              {student.userId && (
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '700',
                  }}
                >
                  {student.userId}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-occupied" style={{ fontSize: '0.72rem' }}>
                {student.department || 'General'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: isApproved ? '#059669' : isPending ? '#d97706' : '#dc2626',
                  backgroundColor: isApproved ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isApproved && <CheckCircle size={12} />}
                {isPending && <Clock size={12} />}
                <span style={{ textTransform: 'capitalize' }}>{student.approvalStatus || 'Approved'}</span>
              </span>

              <span
                className={`badge ${student.isActive ? 'badge-available' : 'badge-cancelled'}`}
                style={{ fontSize: '0.72rem' }}
              >
                {student.isActive ? 'Active Account' : 'Deactivated'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic & Contact Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Mail size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Email Address</span>
            </div>
            <div style={{ fontWeight: '600', wordBreak: 'break-all' }}>{student.email}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Phone size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Phone Contact</span>
            </div>
            <div style={{ fontWeight: '600' }}>{student.phoneNumber || 'Not provided'}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <GraduationCap size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Academic Department</span>
            </div>
            <div style={{ fontWeight: '600' }}>{student.department}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <BookOpen size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Year of Study</span>
            </div>
            <div style={{ fontWeight: '600' }}>{student.yearOfStudy || 'Undergraduate'}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Briefcase size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Specialization / Role</span>
            </div>
            <div style={{ fontWeight: '600' }}>{student.profession || 'Student'}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Calendar size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Registered Date</span>
            </div>
            <div style={{ fontWeight: '600' }}>
              {student.createdAt ? formatBookingDate(student.createdAt) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Verification Metadata */}
        {student.approvedBy && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={20} />
            <div>
              <span style={{ fontWeight: '700' }}>Faculty Verification Completed:</span>
              <div style={{ fontSize: '0.775rem', marginTop: '2px' }}>
                Approved by Prof. {student.approvedBy?.userName || student.approvedBy}
                {student.approvedAt && ` on ${formatBookingDate(student.approvedAt)}`}
              </div>
            </div>
          </div>
        )}

        {/* Technical Skills */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Technical Skills
          </h4>
          {student.skills && student.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {student.skills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No technical skills listed
            </span>
          )}
        </div>

        {/* Academic Interests */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Academic Interests
          </h4>
          {student.interests && student.interests.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {student.interests.map((interest, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  #{interest}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No academic interests listed
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
};
