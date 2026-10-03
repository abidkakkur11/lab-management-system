import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are no items to display right now.',
  action,
}) => {
  return (
    <div className="empty-state">
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--text-muted)',
        }}
      >
        <Icon size={26} />
      </div>
      <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>{title}</h4>
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          maxWidth: '380px',
          margin: '0 auto 20px auto',
        }}
      >
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
