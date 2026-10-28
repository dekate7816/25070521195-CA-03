import React from 'react';

export function SkeletonLoader({ rows = 3, height = '48px', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            width: '100%',
            borderRadius: 'var(--radius-md)',
          }}
        />
      ))}
    </div>
  );
}
