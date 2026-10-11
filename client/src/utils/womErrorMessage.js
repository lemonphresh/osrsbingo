export const WOM_ERROR_TOAST_DURATION = 8000;

export function getWomErrorMessage(error) {
  const message = error?.message ?? String(error ?? '');

  if (/yearly gains.*unavailable|yearly.*temporarily unavailable/i.test(message)) {
    return 'Wise Old Man could not provide yearly EHP/EHB right now. Because those stats affect this balance, nothing was changed. Try again shortly.';
  }

  if (/\b429\b|rate[ -]?limit/i.test(message)) {
    return 'Wise Old Man is rate-limiting requests right now. No players were marked missing and nothing was changed. Wait about a minute, then try again.';
  }

  if (/WOM|Wise Old Man|network|fetch/i.test(message)) {
    return 'Wise Old Man is temporarily unavailable. Your player data was not changed. Try again shortly.';
  }

  return 'Player stats could not be loaded. Nothing was changed. Try again shortly.';
}
