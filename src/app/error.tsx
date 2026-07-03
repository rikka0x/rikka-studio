'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Rikka Studio error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          marginBottom: '1rem',
        }}
        aria-hidden="true"
      >
        ⚡
      </div>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: '#94a3b8',
          maxWidth: '360px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}
      >
        The prompt run failed unexpectedly. Try again — demo mode works without
        any API key.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid #7c3aed',
          background: 'transparent',
          color: '#a78bfa',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  );
}
