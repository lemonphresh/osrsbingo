import React from 'react';

const RELOAD_KEY = 'chunk_error_reloaded';

function isChunkError(error) {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const msg = error.message ?? '';
  return (
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to fetch dynamically imported module')
  );
}

export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (isChunkError(error)) {
      // Auto-reload once to bust the stale chunk cache
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === 'true';
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, 'true');
        window.location.reload();
        return;
      }
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunk = isChunkError(error);
    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === 'true';

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: '#1a202c', color: '#e2e8f0', fontFamily: 'sans-serif',
        gap: '12px', padding: '24px', textAlign: 'center',
      }}>
        {chunk && !alreadyReloaded ? (
          // Auto-reload is about to fire — show a brief loading state
          <p style={{ color: '#a0aec0', fontSize: '14px' }}>Refreshing…</p>
        ) : (
          <>
            <span style={{ fontSize: '48px' }}>💀</span>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#fc8181' }}>
              {chunk ? 'App updated — please refresh' : 'Something went wrong'}
            </h2>
            <p style={{ margin: 0, color: '#a0aec0', fontSize: '14px', maxWidth: '360px' }}>
              {chunk
                ? 'A new version was deployed while you had the page open. A refresh should fix it.'
                : 'An unexpected error occurred. Try refreshing, or head back to the home page.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  sessionStorage.removeItem(RELOAD_KEY);
                  window.location.reload();
                }}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none',
                  background: '#e53e3e', color: 'white', cursor: 'pointer', fontSize: '14px',
                }}
              >
                Refresh page
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem(RELOAD_KEY);
                  window.location.href = '/';
                }}
                style={{
                  padding: '8px 20px', borderRadius: '6px',
                  border: '1px solid #4a5568', background: 'transparent',
                  color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
                }}
              >
                Go home
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
}
