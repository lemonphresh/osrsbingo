// Detects whether the app is running locally or on a staging host. Used to
// gate admin-only development shortcuts (like the "send mock submission"
// buttons on the tile modals) so they never render in production.
//
// Hostname-based on purpose — a determined site admin could still call the
// underlying mutation from devtools in prod, but the UI stays clean.
export function isDevEnv() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return true;
  if (host.includes('staging')) return true;
  return false;
}

// Placeholder image url for mock submissions — deterministic so testers can
// spot it on the refs page. Any URL that Discord/browsers can load works.
export const MOCK_SCREENSHOT_URL =
  'https://placehold.co/600x400/2b1f33/efe6d0?text=mock+spoopy+screenshot';
