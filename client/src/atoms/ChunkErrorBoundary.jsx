import React from 'react';

const RELOAD_KEY = 'chunk_error_reload_at';
const RELOAD_COOLDOWN_MS = 30 * 1000;
const CACHE_BUST_PARAM = '_appRefresh';

export function isChunkError(error) {
  if (!error) return false;
  if (error.name === 'ChunkLoadError' || error.code === 'CSS_CHUNK_LOAD_FAILED') return true;
  const msg = error.message ?? '';
  return (
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to fetch dynamically imported module')
  );
}

function recentlyRetried() {
  try {
    const lastAttempt = Number(sessionStorage.getItem(RELOAD_KEY));
    return Number.isFinite(lastAttempt) && Date.now() - lastAttempt < RELOAD_COOLDOWN_MS;
  } catch (_) {
    return false;
  }
}

function rememberRetry() {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch (_) {
    // Storage can be unavailable in hardened/private browser contexts.
  }
}

export function latestVersionUrl(location = window.location) {
  const url = new URL(location.href);
  url.searchParams.set(CACHE_BUST_PARAM, String(Date.now()));
  return url.toString();
}

function loadLatestVersion() {
  rememberRetry();
  window.location.replace(latestVersionUrl());
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    background: 'linear-gradient(180deg, #051b24 0%, #07140d 100%)',
    color: '#e2e8f0',
    fontFamily: 'Open Sans, sans-serif',
    textAlign: 'center',
  },
  card: {
    width: 'min(100%, 480px)',
    padding: '32px 28px',
    border: '1px solid #28533a',
    borderRadius: '14px',
    background: '#091a10',
    boxShadow: '0 20px 55px rgba(0, 0, 0, 0.35)',
  },
  eyebrow: {
    margin: '0 0 10px',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: { margin: 0, fontSize: '24px', lineHeight: 1.25, color: '#f0fff4' },
  copy: { margin: '14px auto 0', maxWidth: '390px', color: '#a7c7b0', lineHeight: 1.6 },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '24px',
  },
  primaryButton: {
    padding: '10px 18px',
    border: '1px solid #4ade80',
    borderRadius: '7px',
    background: '#22c55e',
    color: '#04130a',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
  },
  secondaryButton: {
    padding: '10px 18px',
    border: '1px solid #3d6b4a',
    borderRadius: '7px',
    background: 'transparent',
    color: '#d4f0da',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  footnote: { margin: '18px 0 0', color: '#63866d', fontSize: '12px', lineHeight: 1.5 },
};

export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, refreshing: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (isChunkError(error) && !recentlyRetried()) {
      this.setState({ refreshing: true });
      loadLatestVersion();
    }
  }

  render() {
    const { error, refreshing } = this.state;
    if (!error) return this.props.children;

    const chunk = isChunkError(error);

    return (
      <main style={styles.page} role="alert">
        <section style={styles.card}>
          <p style={styles.eyebrow}>{chunk ? 'Site update detected' : 'Unexpected error'}</p>
          <h1 style={styles.title}>
            {refreshing
              ? 'Loading the newest version…'
              : chunk
              ? 'This tab needs a quick refresh'
              : 'Something went wrong'}
          </h1>
          <p style={styles.copy}>
            {chunk
              ? 'The site was updated while this page was open, so one of its older files is no longer available. Your account and event data are safe.'
              : 'The page hit an unexpected error. Reload it to try again, or return to the home page.'}
          </p>
          {!refreshing && (
            <div style={styles.actions}>
              <button type="button" onClick={loadLatestVersion} style={styles.primaryButton}>
                {chunk ? 'Load latest version' : 'Reload page'}
              </button>
              <button
                type="button"
                onClick={() => window.location.replace('/')}
                style={styles.secondaryButton}
              >
                Return home
              </button>
            </div>
          )}
          {chunk && !refreshing && (
            <p style={styles.footnote}>
              If it happens again immediately, close this tab and reopen the site.
            </p>
          )}
        </section>
      </main>
    );
  }
}
