// Shared helpers for carrying a "come back here after login/signup" hint
// across the auth flow. Any page that redirects an unauthenticated user to
// `/login` or `/signup` should attach `?returnTo=<current path+search>` so
// Login/SignUp can send them back on success instead of dumping everyone on
// `/user/<id>`.
//
// Security: returnTo is user-controlled (lives in the URL), so we treat it
// like untrusted input. Only same-origin, path-relative strings are allowed
// — anything starting with `//`, a scheme, or missing the leading `/` is
// rejected so a crafted link can't bounce a freshly-logged-in user off-site.

import { useLocation } from 'react-router-dom';

const LOGIN_PATH = '/login';
const SIGNUP_PATH = '/signup';

// Pre-encode `?` and `&` as part of the current path so the resulting URL
// parses cleanly when returnTo itself contains query params.
function encodeReturnTo(path) {
  if (typeof path !== 'string' || !path) return null;
  if (!path.startsWith('/')) return null;
  // Reject protocol-relative URLs (//evil.com) by requiring a non-`/` char
  // right after the leading `/`.
  if (path.startsWith('//')) return null;
  return encodeURIComponent(path);
}

// Parses + validates a `returnTo` value read off a URL. Returns `null` for
// anything suspicious so callers can fall back to a safe default.
export function sanitizeReturnTo(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//')) return null;
  // Nothing with a protocol or whitespace in it should ever end up here.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return null;
  if (/\s/.test(decoded)) return null;
  // Reject the auth pages themselves — otherwise someone bouncing a user to
  // `/login?returnTo=%2Flogin` would land them right back on login after a
  // successful auth and infinite-loop. Compare only the pathname so query
  // strings don't change the answer.
  const pathname = decoded.split('?')[0];
  if (pathname === LOGIN_PATH || pathname === SIGNUP_PATH) return null;
  return decoded;
}

export function buildLoginUrl(returnTo) {
  const encoded = encodeReturnTo(returnTo);
  return encoded ? `${LOGIN_PATH}?returnTo=${encoded}` : LOGIN_PATH;
}

export function buildSignupUrl(returnTo) {
  const encoded = encodeReturnTo(returnTo);
  return encoded ? `${SIGNUP_PATH}?returnTo=${encoded}` : SIGNUP_PATH;
}

function currentPathFor(location) {
  // Elide the auth pages so a nav-bar "log in" link rendered on /login itself
  // doesn't produce `/login?returnTo=%2Flogin` (which would loop after
  // a successful auth).
  if (location.pathname === LOGIN_PATH || location.pathname === SIGNUP_PATH) return null;
  return `${location.pathname}${location.search}`;
}

// `useLoginUrl()` — hook form, closes over the caller's current location so
// a plain `<Link to={useLoginUrl()}>` round-trips back to the page the user
// was on.
export function useLoginUrl() {
  const location = useLocation();
  return buildLoginUrl(currentPathFor(location));
}

export function useSignupUrl() {
  const location = useLocation();
  return buildSignupUrl(currentPathFor(location));
}

// Read `returnTo` off the current URL (if present + safe) and hand back a
// path the Login/SignUp pages can navigate to on success. Falls back to the
// provided default when returnTo is missing or rejected.
export function readReturnToParam(search, fallback = null) {
  const params = new URLSearchParams(search ?? '');
  const raw = params.get('returnTo');
  const safe = sanitizeReturnTo(raw);
  return safe || fallback;
}
